const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const port = process.env.PORT || 3000;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(cors());
app.use(express.json());
app.use(express.static("."));

function toNumber(value) {
  return value == null ? null : Number(value);
}

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("select 1");
    res.json({ ok: true, database: "connected" });
  } catch (error) {
    res.status(200).json({ ok: true, database: "mock", note: error.message });
  }
});

app.get("/api/current", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `select recorded_at, mmi_value, mood_label, mood_comment, nifty_value
       from mmi_readings
       order by recorded_at desc
       limit 1`
    );

    if (!rows.length) {
      return res.json({
        recordedAt: new Date().toISOString(),
        mmiValue: 65.51,
        moodLabel: "Greed",
        moodComment: "the greed zone.",
        niftyValue: 24200,
      });
    }

    const row = rows[0];
    res.json({
      recordedAt: row.recorded_at,
      mmiValue: toNumber(row.mmi_value),
      moodLabel: row.mood_label,
      moodComment: row.mood_comment,
      niftyValue: toNumber(row.nifty_value),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/week", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `select summary_date, avg_value, high_value, low_value, open_value, close_value, sample_count
       from v_mmi_last_7_days
       order by summary_date desc`
    );
    res.json({ rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/history", async (req, res) => {
  const days = Math.max(1, Math.min(Number(req.query.days || 7), 30));

  try {
    const { rows } = await pool.query(
      `select recorded_at, mmi_value, mood_label, mood_comment, nifty_value
       from mmi_readings
       where recorded_at >= now() - ($1 || ' days')::interval
       order by recorded_at desc
       limit 2000`,
      [days]
    );
    res.json({ rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`MMI dashboard server running on http://localhost:${port}`);
});
