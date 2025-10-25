import express from "express";
import cors from "cors";
import { ytDlp } from "yt-dlp-exec";
import path from "path";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 5000;

const DOWNLOAD_DIR = path.join(process.cwd(), "downloads");
if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

app.use(cors());
app.use(express.json());
app.use("/files", express.static(DOWNLOAD_DIR));

app.get("/", (req, res) => res.send("Servidor funcionando 🚀"));

app.post("/download", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ message: "Falta la URL" });

  const timestamp = Date.now();
  const outputTemplate = path.join(DOWNLOAD_DIR, `${timestamp}-%(title)s.%(ext)s`);

  try {
    await ytDlp(url, { output: outputTemplate, format: "best" });

    const files = fs.readdirSync(DOWNLOAD_DIR);
    const file = files.find((f) => f.startsWith(String(timestamp)));
    if (!file) return res.status(500).json({ message: "No se encontró el archivo descargado" });

    const fileUrl = `/files/${encodeURIComponent(file)}`;
    res.json({ message: "Video descargado correctamente ✅", url: fileUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al descargar el video", error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
  console.log(`Archivos se sirven en /files/`);
});
