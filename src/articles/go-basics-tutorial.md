---
title: "Go for JavaScript Developers: The Very Basics"
description: "A practical introduction to Go for JS developers who want to build backend services, starting from zero."
tags: ["go", "golang", "javascript", "backend", "tutorial"]
pubDate: "2025-01-10T10:00:00Z"
series: "go-basics"
seriesOrder: 1
---

## Go for JavaScript Developers: The Very Basics

If you're a JavaScript developer curious about Go, you're in the right place. I've been writing JS for years and recently started exploring Go for backend work — specifically for building services that sync data between APIs and databases.

This tutorial assumes you know JavaScript but have never written a line of Go. We'll start from absolute zero.

## Why Go?

**Short answer:** Go is simple, fast, and compiles to a single binary you can deploy anywhere.

**Long answer:** Coming from JavaScript, you're used to npm, node_modules, runtime versions, and deployment headaches. Go compiles your entire application into one executable file. Copy it to a server, run it. That's deployment.

Go is also genuinely simple. The language spec is small — you can learn the whole thing in a few weeks. There's usually one obvious way to do something, which means less decision fatigue.

## Installing Go

On a Mac with Homebrew:

```bash
brew install go
```

Verify it worked:

```bash
go version
```

You should see something like `go version go1.22.0 darwin/arm64`.

That's it. No version managers, no separate package managers. Go is refreshingly self-contained.

## Your First Go Program

Create a new folder and file:

```bash
mkdir hello-go
cd hello-go
touch main.go
```

Open `main.go` and add:

```go
package main

import "fmt"

func main() {
    fmt.Println("Hello from Go")
}
```

Let's break this down:

- `package main` — Every Go file belongs to a package. The `main` package is special: it's where your program starts
- `import "fmt"` — We're importing the `fmt` package (short for "format") which handles printing to the console
- `func main()` — The entry point of your program. When you run the app, this function executes
- `fmt.Println()` — Prints a line to the console. Think of it like `console.log()`

Run it:

```bash
go run main.go
```

You should see `Hello from Go` printed.

## Variables: Where Things Start to Feel Different

In JavaScript, you might write:

```js
let name = "Gareth";
const age = 30;
```

In Go:

```go
package main

import "fmt"

func main() {
    var name string = "Gareth"
    age := 30

    fmt.Println(name, age)
}
```

Two ways to declare variables here:

- `var name string = "Gareth"` — Explicit declaration with type. We're saying "create a variable called `name` that holds a `string`"
- `age := 30` — Short declaration. Go figures out the type from the value. This only works inside functions

The `:=` syntax is what you'll use most often. It's Go's equivalent of `const` in spirit — though technically Go variables are mutable.

**Key difference from JS:** Go is statically typed. Once a variable has a type, it can't hold a different type:

```go
age := 30
age = "thirty" // This won't compile
```

JavaScript would let this slide. Go won't.

## Functions

JavaScript:

```js
function add(a, b) {
  return a + b;
}
```

Go:

```go
func add(a int, b int) int {
    return a + b
}
```

- `func add` — Declaring a function called `add`
- `(a int, b int)` — Two parameters, both are integers. Types come after the name
- `int` (after the parentheses) — The return type. This function returns an integer

You can shorten repeated types:

```go
func add(a, b int) int {
    return a + b
}
```

When `a` and `b` are both `int`, you only need to write the type once.

### Multiple Return Values

This is where Go gets interesting. Functions can return multiple values:

```go
func divide(a, b int) (int, error) {
    if b == 0 {
        return 0, fmt.Errorf("cannot divide by zero")
    }
    return a / b, nil
}
```

- `(int, error)` — This function returns two things: an integer and an error
- `fmt.Errorf()` — Creates an error with a message
- `nil` — Go's version of `null`. When there's no error, we return `nil`

Calling it:

```go
result, err := divide(10, 2)
if err != nil {
    fmt.Println("Something went wrong:", err)
    return
}
fmt.Println(result)
```

This pattern — returning a value and an error, then checking the error — is everywhere in Go. There's no `try/catch`. You check errors explicitly after every operation that might fail.

It feels tedious at first. Give it a week. You'll start to appreciate knowing exactly where things can go wrong.

## Structs: Go's Version of Objects

JavaScript objects are flexible:

```js
const person = {
  name: "Gareth",
  age: 30,
};
```

Go uses structs, which are more rigid:

```go
type Person struct {
    Name string
    Age  int
}

func main() {
    person := Person{
        Name: "Gareth",
        Age:  30,
    }

    fmt.Println(person.Name)
}
```

- `type Person struct` — We're defining a new type called `Person`
- `Name string` — A field called `Name` that holds a string. Note the capital letter — this matters (we'll get to why)
- `Person{Name: "Gareth", Age: 30}` — Creating an instance of the struct

**Why capital letters?** In Go, capitalisation controls visibility:

- `Name` (capital) — Exported, accessible from other packages. Like `export` in JS
- `name` (lowercase) — Unexported, private to this package

This applies to functions, variables, and struct fields.

## Slices: Go's Arrays

JavaScript arrays:

```js
const numbers = [1, 2, 3];
numbers.push(4);
```

Go slices:

```go
numbers := []int{1, 2, 3}
numbers = append(numbers, 4)
```

- `[]int` — A slice of integers. The empty brackets mean it's a slice (dynamic length), not an array (fixed length)
- `append()` — Adds an element. Unlike JS, this returns a new slice rather than modifying in place

Looping through a slice:

```go
for i, num := range numbers {
    fmt.Println(i, num)
}
```

- `range` — Iterates over the slice
- `i, num` — Each iteration gives you the index and the value

If you don't need the index:

```go
for _, num := range numbers {
    fmt.Println(num)
}
```

The underscore `_` tells Go "I'm ignoring this value". Go won't compile if you declare a variable and don't use it — the underscore is the escape hatch.

## Maps: Key-Value Pairs

JavaScript:

```js
const scores = {
  alice: 100,
  bob: 85,
};
```

Go:

```go
scores := map[string]int{
    "alice": 100,
    "bob":   85,
}

fmt.Println(scores["alice"])
```

- `map[string]int` — A map with string keys and integer values
- `scores["alice"]` — Accessing a value by key

Checking if a key exists:

```go
score, exists := scores["charlie"]
if !exists {
    fmt.Println("Charlie hasn't played yet")
}
```

When you access a map, you can get two values back: the value and a boolean indicating whether the key existed.

## Putting It Together

Here's a small program that combines everything:

```go
package main

import "fmt"

type Order struct {
    ID     int
    Amount float64
    Status string
}

func main() {
    orders := []Order{
        {ID: 1, Amount: 99.99, Status: "shipped"},
        {ID: 2, Amount: 149.50, Status: "pending"},
        {ID: 3, Amount: 29.99, Status: "shipped"},
    }

    total := calculateShippedTotal(orders)
    fmt.Printf("Total shipped: £%.2f\n", total)
}

func calculateShippedTotal(orders []Order) float64 {
    var total float64

    for _, order := range orders {
        if order.Status == "shipped" {
            total += order.Amount
        }
    }

    return total
}
```

- We define an `Order` struct with three fields
- Create a slice of orders
- Pass them to a function that filters and sums
- `fmt.Printf` lets us format output — `%.2f` means "float with 2 decimal places"

Run it:

```bash
go run main.go
```

Output: `Total shipped: £129.98`

## What's Next

This covers the absolute basics — enough to read Go code and understand what's happening. Next, we'll build something real: a small HTTP server that talks to a database.

The goal is to create a service that syncs orders from an API (like Magento) into a local database. That's where Go starts to shine.

---

_This is part one of a series on Go for JavaScript developers. Next up: building your first HTTP server and connecting to a database._

**Code examples:** All code is copy-paste ready. If something doesn't work, let me know.

- [Go playground](https://go.dev/play/)
- [Go Docs](https://go.dev/doc/)
