require('dotenv').config(); 
const express = require('express'); 
const mongoose = require('mongoose'); 
const cors = require('cors'); 

const app = express(); 
app.use(express.json()); 
app.use(cors()); 

// 1. Підключення до MongoDB (Оновлено для Node.js v24+)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/olympics';
mongoose.connect(MONGO_URI) 
  .then(() => console.log('✅ Connected to MongoDB (olympics)')) 
  .catch(error => console.error('❌ MongoDB connection error:', error)); 

// 2. Схеми даних
const athleteSchema = new mongoose.Schema({ 
  id_athlete: String, 
  full_name: String, 
  birth_date: String, 
  birth_country: String, 
  current_country: String, 
  region: String, 
  sport: String, 
  olympics_count: Number
}); 

const resultSchema = new mongoose.Schema({ 
  id_sport: String, 
  id_athlete: String, 
  discipline: String, 
  rank: Number // Number краще для графіків
}); 

const olympicSchema = new mongoose.Schema({ 
  year: Number, 
  host_city: String 
}); 

const sportSchema = new mongoose.Schema({ 
  id_sport: String, 
  sport: String 
}); 

// 3. Моделі
const Athlete = mongoose.model('Athlete', athleteSchema, 'athletes'); 
const Result = mongoose.model('Result', resultSchema, 'results'); 
const Olympic = mongoose.model('Olympic', olympicSchema, 'olympics'); 
const Sport = mongoose.model('Sport', sportSchema, 'sports'); 

// 4. Генератор HTML таблиць (Стиль: Прапор України)
const generateTable = (data, columns, title) => { 
  if (!data || data.length === 0) return `
    <body style="background: linear-gradient(#0057B7, #FFD700); font-family: sans-serif; text-align: center; color: white;">
      <h2>No data found for: ${title}</h2>
      <button onclick="location.href='/'" style="padding: 10px; cursor: pointer;">Back to Menu</button>
    </body>`; 

  let tableHTML = ` 
    <html> 
    <head> 
      <title>${title}</title> 
      <style> 
        body { background: linear-gradient(to bottom, #0057B7, #FFD700); font-family: Arial, sans-serif; color: white; min-height: 100vh; padding: 20px; margin: 0; } 
        table { width: 90%; border-collapse: collapse; margin: 20px auto; background: rgba(255, 255, 255, 0.95); color: #333; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.3); } 
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; } 
        th { background-color: #f2f2f2; color: #0057B7; text-transform: uppercase; font-size: 14px; } 
        h2 { text-align: center; text-shadow: 2px 2px 4px rgba(0,0,0,0.5); font-size: 28px; } 
        .back-btn { display: inline-block; padding: 10px 20px; background: #0044cc; color: white; text-decoration: none; border-radius: 5px; margin-bottom: 20px; transition: 0.3s; }
        .back-btn:hover { background: #002266; }
      </style> 
    </head> 
    <body> 
      <a href="/" class="back-btn">← Back to Home</a>
      <h2>${title}</h2> 
      <table> 
        <tr>${columns.map(col => `<th>${col.replace('_', ' ')}</th>`).join('')}</tr>`; 

  data.forEach(item => { 
    tableHTML += `<tr>${columns.map(col => `<td>${item[col] || '-'}</td>`).join('')}</tr>`; 
  }); 

  tableHTML += `</table></body></html>`; 
  return tableHTML; 
}; 

// 5. Роути (Ендпоінти)

// Головна сторінка
app.get('/', (req, res) => { 
  res.send(` 
    <html> 
    <head> 
      <title>Olympic Ukraine Dashboard</title> 
      <style> 
        body { background: linear-gradient(to bottom, #0057B7, #FFD700); font-family: Arial, sans-serif; text-align: center; padding: 50px; color: white; } 
        .menu { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; max-width: 800px; margin: 0 auto; }
        button { padding: 20px; font-size: 18px; border: none; border-radius: 12px; background: #0044cc; color: white; cursor: pointer; transition: 0.3s; box-shadow: 0 4px 6px rgba(0,0,0,0.2); } 
        button:hover { background: #002266; transform: translateY(-3px); } 
        h1 { font-size: 3.5em; margin-bottom: 40px; text-shadow: 3px 3px 6px rgba(0,0,0,0.5); }
      </style> 
    </head> 
    <body> 
      <h1>Olympic Ukraine</h1> 
      <div class="menu">
        <button onclick="location.href='/athletes'">🏃 Athletes</button> 
        <button onclick="location.href='/sport'">🏆 Sports</button> 
        <button onclick="location.href='/olympics'">📅 Olympics</button> 
        <button onclick="location.href='/search'">🔍 Search</button> 
        <button onclick="location.href='/compare'">📊 Compare</button> 
        <button onclick="location.href='/results'">🏅 Results</button> 
      </div>
    </body> 
    </html> 
  `); 
}); 

// Списки
app.get('/athletes', async (req, res) => { 
  try { 
    const data = await Athlete.find(); 
    res.send(generateTable(data, ['id_athlete', 'full_name', 'birth_date', 'current_country', 'sport'], 'All Athletes')); 
  } catch (e) { res.status(500).send('Database Error'); } 
}); 

app.get('/sport', async (req, res) => { 
  try { 
    const data = await Sport.find(); 
    res.send(generateTable(data, ['id_sport', 'sport'], 'Olympic Sports')); 
  } catch (e) { res.status(500).send('Database Error'); } 
}); 

app.get('/olympics', async (req, res) => { 
  try { 
    const data = await Olympic.find(); 
    res.send(generateTable(data, ['year', 'host_city'], 'Olympic History')); 
  } catch (e) { res.status(500).send('Database Error'); } 
}); 

// Пошук
app.get('/search', (req, res) => { 
  res.send(`
    <body style="background: linear-gradient(#0057B7, #FFD700); text-align: center; font-family: sans-serif; color: white; padding-top: 100px;">
      <h2>Find Athlete by ID</h2>
      <form action="/search/result">
        <input name="id_athlete" style="padding: 10px; border-radius: 5px; border: none;" placeholder="e.g. 1" required>
        <button style="padding: 10px 20px; background: #0044cc; color: white; border: none; border-radius: 5px;">Search</button>
      </form>
      <br><a href="/" style="color: white;">Back</a>
    </body>
  `); 
});

app.get('/search/result', async (req, res) => { 
  const athlete = await Athlete.findOne({ id_athlete: req.query.id_athlete }); 
  res.send(generateTable(athlete ? [athlete] : [], ['id_athlete', 'full_name', 'sport', 'current_country'], 'Search Result')); 
}); 

// Порівняння з графіком
app.get('/compare', (req, res) => {
  res.send(`
    <body style="background: linear-gradient(#0057B7, #FFD700); text-align: center; font-family: sans-serif; color: white; padding-top: 100px;">
      <h2>Compare Two Athletes</h2>
      <form action="/compare/result">
        <input name="athlete1" style="padding: 10px;" placeholder="ID 1" required>
        <input name="athlete2" style="padding: 10px;" placeholder="ID 2" required>
        <button style="padding: 10px 20px; background: #0044cc; color: white; border: none;">Compare</button>
      </form>
    </body>
  `);
});

app.get('/compare/result', async (req, res) => { 
  try { 
    const { athlete1, athlete2 } = req.query; 
    const res1 = await Result.find({ id_athlete: athlete1 }); 
    const res2 = await Result.find({ id_athlete: athlete2 }); 

    const all = [...res1, ...res2];
    const tableHTML = generateTable(all, ['id_athlete', 'discipline', 'rank'], 'Comparison Table'); 

    const chartScript = ` 
      <div style="background: white; width: 80%; margin: 20px auto; padding: 20px; border-radius: 10px;">
        <canvas id="compChart"></canvas> 
      </div>
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script> 
      <script> 
        const ctx = document.getElementById('compChart').getContext('2d'); 
        new Chart(ctx, { 
          type: 'bar', 
          data: { 
            labels: ${JSON.stringify(all.map(r => 'ID:' + r.id_athlete + ' - ' + r.discipline))}, 
            datasets: [{ 
              label: 'Rank (1 is best)', 
              data: ${JSON.stringify(all.map(r => r.rank))}, 
              backgroundColor: '#0057B7' 
            }] 
          }, 
          options: { scales: { y: { reverse: true, beginAtZero: false, title: { display: true, text: 'Position' } } } } 
        }); 
      </script> 
    `; 
    res.send(tableHTML + chartScript); 
  } catch (e) { res.status(500).send('Error during comparison'); } 
}); 

// 6. Старт
const PORT = process.env.PORT || 5000; 
app.listen(PORT, () => { 
  console.log('Server is flying!'); 
  console.log('Link: http://localhost:' + PORT); 
});