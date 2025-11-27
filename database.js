const sqlite3 = require('sqlite3').verbose();

// Veritabanı dosyasına bağlanır. Dosya yoksa, oluşturulur.
const db = new sqlite3.Database('./hsound.db', (err) => {
    if (err) {
        console.error('Veritabanı bağlantı hatası:', err.message);
    } else {
        console.log('SQLite veritabanına başarıyla bağlanıldı.');
    }
});

// Kullanıcılar tablosunu oluşturmak için SQL komutu
const createUserTableSql = `
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
);
`;

// Veritabanı kurulumunu çalıştır
db.serialize(() => {
    db.run(createUserTableSql, (err) => {
        if (err) {
            console.error('Kullanıcılar tablosu oluşturulurken hata:', err.message);
        } else {
            console.log('Kullanıcılar tablosu başarıyla oluşturuldu veya zaten mevcut.');
        }
    });
});

// Veritabanı nesnesini diğer dosyalarda kullanılmak üzere dışa aktar
module.exports = db;
