---
title: Edge Cases
icon: warning
group: tests
order: 4
---

# Edge Cases Stress Test

This page tests edge cases, special characters, unicode, and unusual markdown scenarios.

---

## Unicode Characters

### Accented Characters

àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ

ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ

### Currency Symbols

$ € £ ¥ ₹ ₽ ₿ ¢ ƒ ₩ ₪ ₫ ₭ ₮ ₯ ₱ ₲ ₳ ₴ ₵

### Mathematical Symbols

± × ÷ = ≠ < > ≤ ≥ ≈ ≡ ∞ √ ∑ ∏ ∫ ∂ ∆ ∇ ∈ ∉ ∩ ∪ ⊂ ⊃ ⊆ ⊇

### Greek Letters

α β γ δ ε ζ η θ ι κ λ μ ν ξ ο π ρ σ τ υ φ χ ψ ω

Α Β Γ Δ Ε Ζ Η Θ Ι Κ Λ Μ Ν Ξ Ο Π Ρ Σ Τ Υ Φ Χ Ψ Ω

### Arrows

← → ↑ ↓ ↔ ↕ ⇐ ⇒ ⇑ ⇓ ⇔ ⇕ ↖ ↗ ↘ ↙ ↩ ↪ ↵ ↰ ↱ ↲ ↳

### Box Drawing

┌─────┬─────┐
│     │     │
├─────┼─────┤
│     │     │
└─────┴─────┘

### Miscellaneous Symbols

★ ☆ ♠ ♣ ♥ ♦ ♩ ♪ ♫ ♬ ☀ ☁ ☂ ☃ ☄ ★ ☆ ☎ ☏ ✓ ✗ ✓ ✔ ✕ ✖ ✗ ✘

---

## Emoji

### Faces

😀 😃 😄 😁 😆 😅 🤣 😂 🙂 🙃 😉 😊 😇 🥰 😍 🤩 😘 😗 ☺️ 😚 😙 🥲

😋 😛 😜 🤪 😝 🤑 🤗 🤭 🤫 🤔 🤐 🤨 😐 😑 😶 😏 😒 🙄 😬 🤥 😌 😔

😪 🤤 😴 😷 🤒 🤕 🤢 🤮 🤧 🥵 🥶 🥴 😵 🤯 🤠 🥳 🥸 😎 🤓 🧐 😕 😟

### Animals

🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🙈 🙉 🙊 🐒 🐔 🐧 🐦

🐤 🐣 🐥 🦆 🦅 🦉 🦇 🐺 🐗 🐴 🦄 🐝 🐛 🦋 🐌 🐞 🐜 🦟 🦗 🕷️ 🕸️ 🦂

### Food

🍎 🍐 🍊 🍋 🍌 🍉 🍇 🍓 🫐 🍈 🍒 🍑 🥭 🍍 🥥 🥝 🍅 🍆 🥑 🥦 🥬 🥒

🌶️ 🫑 🌽 🥕 🧄 🧅 🥔 🍠 🥐 🥯 🍞 🥖 🥨 🧀 🥚 🍳 🧈 🥞 🧇 🥓 🥩 🍗

### Objects

💻 🖥️ 🖨️ ⌨️ 🖱️ 🖲️ 💽 💾 💿 📀 📱 📲 ☎️ 📞 📟 📠 📺 📻 🎙️ 🎚️ 🎛️ ⏱️

### Flags

🏁 🚩 🎌 🏴 🏳️ 🏳️‍🌈 🏳️‍⚧️ 🏴‍☠️ 🇦🇫 🇦🇱 🇩🇿 🇦🇸 🇦🇩 🇦🇴 🇦🇮 🇦🇶 🇦🇬 🇦🇷 🇦🇲 🇦🇼 🇦🇺 🇦🇹

---

## Special Characters in Context

### HTML-like Characters

These should be escaped properly: < > & " '

In a sentence: The formula a < b && b > c should render correctly.

As code: `<div class="test">&amp;</div>`

In HTML: <div>This might be treated as HTML</div>

### Quotes

"Double quotes"
'Single quotes'
"Curly double quotes"
'Curly single quotes'
«Guillemets»
「Japanese quotes」
『Double Japanese quotes』

### Dashes and Hyphens

Regular hyphen: -
En dash: –
Em dash: —
Minus sign: −
Horizontal bar: ―

### Whitespace Characters

Normal space: [ ]
Non-breaking space: [ ]
Em space: [ ]
Figure space: [ ]
Thin space: [ ]
Hair space: [ ]

---

## HTML Mixed with Markdown

<div style="background: #f0f0f0; padding: 1rem; border-radius: 4px;">
  <p>This is an HTML block with <strong>bold</strong> and <em>italic</em> text.</p>
  <ul>
    <li>HTML list item 1</li>
    <li>HTML list item 2</li>
  </ul>
</div>

This is regular markdown after the HTML block.

Inline HTML: This sentence contains <mark>highlighted text</mark> and <sup>superscript</sup> and <sub>subscript</sub>.

<details>
<summary>Click to expand</summary>

This content is hidden by default.

- Still supports markdown
- Inside the details element

```javascript
const hidden = "code block in details";
```

</details>

<aside>
This is an aside element.
</aside>

---

## Very Long Lines

This is a very long line that should probably wrap at some point but it just keeps going and going and going and going and going and going and going and going and going and going and going and going and going and going and going and going and going and going and going and going and going and going and going and going and going and going and going and going and going and going and going and going.

ThisIsAVeryLongWordWithoutAnySpacesThatShouldProbablyCauseOverflowIssuesOrWrappingProblemsInSomeMarkdownRenderersLetsSeeHowItHandlesThisExtremelyLongUnbrokenStringOfCharacters.

---

## Empty and Whitespace Elements

###

Empty heading above.

-

Single dash list item above.

>

Empty blockquote above.

```

```

Empty code block above.

|   |
|---|

Empty table above.

---

## Deeply Nested Structures

> Level 1
>> Level 2
>>> Level 3
>>>> Level 4
>>>>> Level 5
>>>>>> Level 6
>>>>>>> Level 7
>>>>>>>> Level 8
>>>>>>>>> Level 9
>>>>>>>>>> Level 10

---

## Mixed Nesting

> Blockquote with list:
> - Item 1
>   - Nested item
>     - Deeply nested
>       > And a quote inside!
>       > With multiple lines
>       > - And another list
>       >   1. Ordered inside
>       >   2. More ordered

---

## Escaping Edge Cases

\*\*not bold\*\*

\*not italic\*

\`not code\`

\[not a link\](url)

\!\[not an image\](url)

\# not a heading

\> not a quote

\- not a list

\1. not ordered list

\| not | a | table |

---

## Code in Unusual Places

> `code in blockquote`

- `code in list`
  - `nested code in list`

| `code` | in | table |
|--------|-------|-------|
| `more` | `code` | `here` |

**`code in bold`**

*`code in italic`*

~~`code in strikethrough`~~

[`code in link text`](/)

---

## Zero-Width Characters

Normal​Text​With​Zero​Width​Spaces

‌‍This line has zero-width non-joiners and joiners.

---

## Right-to-Left Text

مرحبا بالعالم (Arabic: Hello World)

שלום עולם (Hebrew: Hello World)

Mixed direction: Hello مرحبا World עולם Test

---

## Mathematical Expressions (if supported)

Inline math: $E = mc^2$

Block math:

$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

$$
\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}
$$

---

## Unusual Link Formats

[Link with (parentheses) in text](/path)

[Link](</path with spaces>)

[Link with "quotes" in text](/)

[Empty href]()

[Just hash](#)

[JavaScript link](javascript:void(0))

[Mailto](mailto:test@example.com)

[Tel](tel:+1234567890)

[Data URL](data:text/plain;base64,SGVsbG8=)

---

## Overlapping Formatting

***Bold and italic***

**Bold with *italic* inside**

*Italic with **bold** inside*

~~Strikethrough with **bold** and *italic*~~

`Code with special chars: <>&"`

---

## Ambiguous Syntax

_underscore_style_text_with_multiple_underscores_

__double__underscore__patterns__

*asterisk*style*text*with*asterisks*

**double**asterisk**patterns**

`inline`code`with`backticks`

---

## Line Break Variations

Line with two trailing spaces  
Should create a break

Line with backslash\
Should also break

Line with <br> tag<br>Another line

Line with <br/> self-closing<br/>Another line

---

## Reference Links Edge Cases

[Undefined reference]

[Case Insensitive][CASE]

[Numeric reference][1]

[case]: /case-insensitive
[1]: /numeric-reference

---

## Autolink Edge Cases

<https://example.com>

<http://example.com>

<mailto:user@example.com>

<ftp://files.example.com>

<not-a-valid-scheme://example.com>

---

## Image Edge Cases

![](https://via.placeholder.com/1 "Image with empty alt")

![Very long alt text that describes the image in great detail for accessibility purposes and might cause layout issues if not handled properly](https://via.placeholder.com/50)

![Image with special chars <>&"'](https://via.placeholder.com/50)

---

## Comments (HTML-style)

<!-- This is an HTML comment and should not render -->

Text before <!-- inline comment --> text after

<!--
Multi-line
comment
block
-->

---

[← Back to home](/)
