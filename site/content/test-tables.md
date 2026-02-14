---
title: Tables
icon: table
group: tests
order: 3
---

# Table Stress Test

This page tests various table configurations and edge cases.

---

## Simple Table

| Name    | Age | City          |
| ------- | --- | ------------- |
| Alice   | 28  | New York      |
| Bob     | 35  | San Francisco |
| Charlie | 42  | Chicago       |

---

## Table with Alignment

| Left Aligned        |  Center Aligned  | Right Aligned |
| :------------------ | :--------------: | ------------: |
| Left 1              |     Center 1     |       Right 1 |
| Left 2              |     Center 2     |       Right 2 |
| Left 3              |     Center 3     |       Right 3 |
| Longer content here | Centered content |      12345.67 |

---

## Table with Inline Formatting

| Feature             | Description        | Status       |
| ------------------- | ------------------ | ------------ |
| **Bold**            | Uses `**text**`    | ✅ Supported |
| _Italic_            | Uses `*text*`      | ✅ Supported |
| `Code`              | Uses backticks     | ✅ Supported |
| ~~Strike~~          | Uses `~~text~~`    | ⚠️ Varies    |
| [Links](/)          | Uses `[text](url)` | ✅ Supported |
| **Mixed _formats_** | Combined styles    | ✅ Works     |

---

## Wide Table (Many Columns)

| Col 1 | Col 2 | Col 3 | Col 4 | Col 5 | Col 6 | Col 7 | Col 8 | Col 9 | Col 10 | Col 11 | Col 12 |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ------ | ------ | ------ |
| A1    | B1    | C1    | D1    | E1    | F1    | G1    | H1    | I1    | J1     | K1     | L1     |
| A2    | B2    | C2    | D2    | E2    | F2    | G2    | H2    | I2    | J2     | K2     | L2     |
| A3    | B3    | C3    | D3    | E3    | F3    | G3    | H3    | I3    | J3     | K3     | L3     |

---

## Tall Table (Many Rows)

| ID  | Product     | Price   | Stock | Category    |
| --- | ----------- | ------- | ----- | ----------- |
| 1   | Widget A    | $10.00  | 150   | Electronics |
| 2   | Widget B    | $15.00  | 89    | Electronics |
| 3   | Gadget C    | $25.00  | 42    | Gadgets     |
| 4   | Device D    | $99.99  | 15    | Devices     |
| 5   | Tool E      | $5.50   | 500   | Tools       |
| 6   | Part F      | $2.25   | 1000  | Parts       |
| 7   | Module G    | $45.00  | 33    | Modules     |
| 8   | Component H | $12.75  | 220   | Components  |
| 9   | Unit I      | $8.00   | 175   | Units       |
| 10  | Item J      | $30.00  | 60    | Items       |
| 11  | Object K    | $18.50  | 95    | Objects     |
| 12  | Thing L     | $7.25   | 300   | Things      |
| 13  | Stuff M     | $22.00  | 45    | Stuff       |
| 14  | Material N  | $3.00   | 800   | Materials   |
| 15  | Resource O  | $55.00  | 28    | Resources   |
| 16  | Asset P     | $120.00 | 12    | Assets      |
| 17  | Element Q   | $9.99   | 400   | Elements    |
| 18  | Factor R    | $14.50  | 180   | Factors     |
| 19  | Entity S    | $35.00  | 50    | Entities    |
| 20  | Instance T  | $6.75   | 250   | Instances   |
| 21  | Sample U    | $11.00  | 130   | Samples     |
| 22  | Example V   | $19.99  | 75    | Examples    |
| 23  | Demo W      | $4.00   | 600   | Demos       |
| 24  | Prototype X | $200.00 | 5     | Prototypes  |
| 25  | Model Y     | $85.00  | 20    | Models      |

---

## Table with Long Content

| Column                                        | Description                                                                                                                                                                                     |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Short                                         | Brief                                                                                                                                                                                           |
| Medium length content                         | This is a moderately long description that might wrap                                                                                                                                           |
| Very long content that should definitely wrap | Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris. |
| Another row                                   | With some content                                                                                                                                                                               |

---

## Table with Special Characters

| Character    | Escaped | HTML Entity |
| ------------ | ------- | ----------- |
| Pipe         | \|      | &#124;      |
| Less than    | <       | &lt;        |
| Greater than | >       | &gt;        |
| Ampersand    | &       | &amp;       |
| Quote        | "       | &quot;      |
| Backtick     | `       | &#96;       |
| Backslash    | \\      | &#92;       |

---

## Table with Numbers and Calculations

| Operation      | Expression | Result |
| -------------- | ---------- | ------ |
| Addition       | 15 + 27    | 42     |
| Subtraction    | 100 - 58   | 42     |
| Multiplication | 6 × 7      | 42     |
| Division       | 84 ÷ 2     | 42     |
| Power          | 2^10       | 1024   |
| Square Root    | √144       | 12     |
| Percentage     | 50% of 200 | 100    |
| Fraction       | 3/4        | 0.75   |

---

## Table with Code Snippets

| Language   | Hello World                      |
| ---------- | -------------------------------- |
| JavaScript | `console.log("Hello")`           |
| Python     | `print("Hello")`                 |
| Rust       | `println!("Hello")`              |
| Go         | `fmt.Println("Hello")`           |
| TypeScript | `console.log("Hello" as string)` |
| Bash       | `echo "Hello"`                   |

---

## Table with Empty Cells

| A   | B   | C   | D   |
| --- | --- | --- | --- |
| 1   | 2   | 3   | 4   |
| 5   |     | 7   | 8   |
|     | 10  |     | 12  |
| 13  | 14  | 15  |     |
|     |     |     |     |

---

## Table with Unicode

| Language | Hello      | Thank You  |
| -------- | ---------- | ---------- |
| English  | Hello      | Thank you  |
| Spanish  | Hola       | Gracias    |
| French   | Bonjour    | Merci      |
| German   | Hallo      | Danke      |
| Japanese | こんにちは | ありがとう |
| Chinese  | 你好       | 谢谢       |
| Korean   | 안녕하세요 | 감사합니다 |
| Russian  | Привет     | Спасибо    |
| Arabic   | مرحبا      | شكرا       |
| Hebrew   | שלום       | תודה       |
| Greek    | Γειά σου   | Ευχαριστώ  |
| Thai     | สวัสดี     | ขอบคุณ     |

---

## Table with Emoji

| Category | Emoji       | Description    |
| -------- | ----------- | -------------- |
| Smileys  | 😀 😃 😄 😁 | Happy faces    |
| Animals  | 🐶 🐱 🐭 🐹 | Cute animals   |
| Food     | 🍎 🍕 🍔 🍟 | Tasty treats   |
| Travel   | ✈️ 🚗 🚂 🚀 | Transportation |
| Weather  | ☀️ 🌧️ ❄️ 🌈 | Weather icons  |
| Objects  | 💻 📱 ⌨️ 🖥️ | Tech items     |
| Symbols  | ✅ ❌ ⚠️ ℹ️ | Status icons   |
| Flags    | 🇺🇸 🇬🇧 🇫🇷 🇩🇪 | Country flags  |

---

## Nested Content in Tables

| Type    | Example                            |
| ------- | ---------------------------------- |
| List    | • Item 1 • Item 2 • Item 3         |
| Quote   | > "Famous quote"                   |
| Math    | x² + y² = z²                       |
| Formula | E = mc²                            |
| Path    | `/usr/local/bin`                   |
| URL     | `https://example.com/path?query=1` |

---

## Data Table

| Timestamp           | Event    | User              | Duration (ms) | Success |
| ------------------- | -------- | ----------------- | ------------- | ------- |
| 2024-01-15 08:30:00 | Login    | alice@example.com | 145           | ✅      |
| 2024-01-15 08:30:15 | PageView | alice@example.com | 89            | ✅      |
| 2024-01-15 08:31:02 | APICall  | alice@example.com | 234           | ✅      |
| 2024-01-15 08:31:45 | APICall  | alice@example.com | 5023          | ❌      |
| 2024-01-15 08:32:00 | Retry    | alice@example.com | 187           | ✅      |
| 2024-01-15 08:35:00 | Login    | bob@example.com   | 156           | ✅      |
| 2024-01-15 08:35:30 | PageView | bob@example.com   | 92            | ✅      |
| 2024-01-15 08:36:00 | Upload   | bob@example.com   | 3456          | ✅      |
| 2024-01-15 08:40:00 | Logout   | alice@example.com | 45            | ✅      |
| 2024-01-15 08:45:00 | Logout   | bob@example.com   | 52            | ✅      |

---

## Minimal Table (2 columns, 2 rows)

| A   | B   |
| --- | --- |
| 1   | 2   |

---

## Single Column Table

| Items      |
| ---------- |
| Apple      |
| Banana     |
| Cherry     |
| Date       |
| Elderberry |

---

## Table with Mixed Alignment per Column

| Left | Center | Right | Left | Center | Right |
| :--- | :----: | ----: | :--- | :----: | ----: |
| L1   |   C1   |    R1 | L4   |   C4   |    R4 |
| L2   |   C2   |    R2 | L5   |   C5   |    R5 |
| L3   |   C3   |    R3 | L6   |   C6   |    R6 |

---

[← Back to home](/)
