# Page snapshot

```yaml
- generic [ref=e2]:
  - heading "H-Sound" [level=1] [ref=e3]
  - generic [ref=e4]:
    - heading "Hesap Oluştur" [level=2] [ref=e5]
    - generic [ref=e6]:
      - text: Kullanıcı Adı
      - textbox "Kullanıcı Adı" [ref=e7]: testuser_1764197028276
    - generic [ref=e8]:
      - text: E-posta
      - textbox "E-posta" [ref=e9]: test_1764197028276@example.com
    - generic [ref=e10]:
      - text: Şifre
      - textbox "Şifre" [ref=e11]: password123
    - generic [ref=e12]:
      - text: Şifreyi Onayla
      - textbox "Şifreyi Onayla" [active] [ref=e13]
    - button "Kaydol" [ref=e14] [cursor=pointer]
    - paragraph
  - paragraph [ref=e15]:
    - text: Zaten hesabın var mı?
    - link "Giriş Yap" [ref=e16] [cursor=pointer]:
      - /url: login.html
```