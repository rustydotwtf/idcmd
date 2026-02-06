---
title: Basic Markdown
icon: flask
group: tests
order: 1
---

# Markdown Basics Stress Test

This page tests all core markdown features.

---

## Header Levels

# Heading Level 1

## Heading Level 2

### Heading Level 3

#### Heading Level 4

##### Heading Level 5

###### Heading Level 6

---

## Text Formatting

This is **bold text** and this is **also bold**.

This is _italic text_ and this is _also italic_.

This is **_bold and italic_** and this is **_also bold and italic_**.

This is ~~strikethrough text~~.

This is `inline code` with backticks.

This is `code with special chars: <div> & "quotes"`.

Here's inline code with a backtick inside: `` `backtick` ``.

---

## Horizontal Rules

Using three hyphens:

---

Using three asterisks:

---

Using three underscores:

---

---

## Unordered Lists

- Item 1
- Item 2
- Item 3

* Alternative syntax item 1
* Alternative syntax item 2

- Plus syntax item 1
- Plus syntax item 2

### Deeply Nested Unordered List

- Level 1 Item A
  - Level 2 Item A.1
    - Level 3 Item A.1.1
      - Level 4 Item A.1.1.1
        - Level 5 Item A.1.1.1.1
          - Level 6 Item A.1.1.1.1.1
            - Level 7 Item A.1.1.1.1.1.1
  - Level 2 Item A.2
- Level 1 Item B
  - Level 2 Item B.1
  - Level 2 Item B.2
    - Level 3 Item B.2.1
    - Level 3 Item B.2.2

---

## Ordered Lists

1. First item
2. Second item
3. Third item

### Starting from different numbers

5. Item starting at 5
6. Next item
7. And another

### Deeply Nested Ordered List

1. Level 1 Item 1
   1. Level 2 Item 1.1
      1. Level 3 Item 1.1.1
         1. Level 4 Item 1.1.1.1
            1. Level 5 Item 1.1.1.1.1
   2. Level 2 Item 1.2
2. Level 1 Item 2
   1. Level 2 Item 2.1
   2. Level 2 Item 2.2
      1. Level 3 Item 2.2.1
      2. Level 3 Item 2.2.2

---

## Mixed Lists

1. Ordered item 1
   - Unordered sub-item
   - Another unordered sub-item
     1. Back to ordered
     2. Another ordered
        - Unordered again
2. Ordered item 2
   - Mixed content
     1. Deeply nested ordered
        - With unordered child
          1. And ordered grandchild

---

## Blockquotes

> This is a simple blockquote.

> This is a blockquote
> that spans multiple lines
> in the source.

### Nested Blockquotes

> Level 1 blockquote
>
> > Level 2 nested blockquote
> >
> > > Level 3 deeply nested blockquote
> > >
> > > > Level 4 very deeply nested
> > > >
> > > > > Level 5 extremely nested

### Blockquotes with Other Elements

> ### Heading in blockquote
>
> This is a paragraph in a blockquote.
>
> - List item 1 in blockquote
> - List item 2 in blockquote
>
> ```javascript
> // Code block in blockquote
> const x = 42;
> ```
>
> > Nested quote with **bold** and _italic_ text.

---

## Links

### Inline Links

[Basic link](https://example.com)

[Link with title](https://example.com "Example Title")

[Internal link to about page](/about/)

[Link with special chars](https://example.com/path?query=value&other=123)

### Reference-style Links

[Reference link][ref1]

[Another reference][ref2]

[Link with implicit reference][]

[ref1]: https://example.com/reference1 "Reference 1 Title"
[ref2]: https://example.com/reference2
[Link with implicit reference]: https://example.com/implicit

### Autolinks

<https://example.com>

<user@example.com>

### URLs in Text

Just a plain URL: https://example.com/plain

---

## Images

![Alt text for image](https://via.placeholder.com/150 "Image title")

![Image without title](https://via.placeholder.com/100)

### Reference-style Images

![Reference image][img1]

[img1]: https://via.placeholder.com/200 "Reference image title"

---

## Paragraphs and Line Breaks

This is the first paragraph. It has multiple sentences. Lorem ipsum dolor sit amet, consectetur adipiscing elit.

This is the second paragraph after a blank line.

This line has two trailing spaces for a hard break  
This is on a new line but same paragraph.

This uses backslash for line break\
This is also on a new line.

---

## Escape Characters

These special characters are escaped:

\*not italic\*

\*\*not bold\*\*

\`not code\`

\[not a link\]

\# not a heading

\- not a list item

\> not a blockquote

---

## Task Lists

- [x] Completed task
- [x] Another completed task
- [ ] Incomplete task
- [ ] Another incomplete task
  - [x] Nested completed task
  - [ ] Nested incomplete task

---

## Definition Lists (if supported)

Term 1
: Definition 1a
: Definition 1b

Term 2
: Definition 2

---

## Footnotes (if supported)

Here is a sentence with a footnote[^1].

Another sentence with another footnote[^note].

[^1]: This is the first footnote.

[^note]: This is a named footnote with more content.

---

[← Back to home](/)
