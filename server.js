import express from "express";
import cors from "cors";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

// Crear app
const app = express();
const PORT = process.env.PORT || 5000;

// Carpeta donde se guardarán los videos
const DOWNLOAD_DIR = path.join(process.cwd(), "downloads");

// Asegurar que exista
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

// ------------------ MIDDLEWARES ------------------
app.use(cors());           // Permitir conexiones desde el frontend
app.use(express.json());   // Permitir parsear JSON

// ⚡ Exponer carpeta downloads
app.use("/files", express.static(DOWNLOAD_DIR));
// ---------------------------------------------------

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("Servidor funcionando 🚀");
});

// Ruta POST para descargar videos
app.post("/download", (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ message: "Falta la URL" });

  const timestamp = Date.now(); // para nombre único
  const outputTemplate = path.join(DOWNLOAD_DIR, `${timestamp}-%(title)s.%(ext)s`);

  // Ejecutar yt-dlp con ruta relativa
  const ytdlp = spawn("./yt-dlp", ["-f", "best", "-o", outputTemplate, url]);

  let errorOutput = "";

  ytdlp.stderr.on("data", (data) => {
    errorOutput += data.toString();
    console.error(data.toString());
  });

  ytdlp.on("close", (code) => {
    if (code !== 0) {
      return res.status(500).json({ message: "Error al descargar el video", error: errorOutput });
    }

    // Buscar el archivo descargado
    const files = fs.readdirSync(DOWNLOAD_DIR);
    const file = files.find((f) => f.startsWith(String(timestamp)));
    if (!file) return res.status(500).json({ message: "No se encontró el archivo descargado" });

    // Crear URL de descarga relativa
    const fileUrl = `/files/${encodeURIComponent(file)}`;
    res.json({ message: "Video descargado correctamente ✅", url: fileUrl });
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
  console.log(`Archivos se sirven en /files/`);
});
