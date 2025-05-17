# MiniLang Design

MiniLang is an extremely small interpreted language intended for demonstration
purposes. The goals are simplicity and minimal syntax.

## Syntax

- Lines may contain assignments or `print` statements.
- Variables consist of alphabetic characters only.
- Integer expressions support `+` and `-` and may reference variables or
  decimal numbers.
- Comments begin with `#` and extend to the end of the line.

Example:

```
a = 1
b = a + 2
print b
```

Outputs `3` when interpreted.

## Interpreter

The interpreter is implemented in C (`src/interpreter.c`). It reads a script
file line by line, evaluating assignments and print statements. Variables are
stored in a simple table with a fixed maximum size.

No attempt is made to detect syntax errors beyond what is necessary to keep the
implementation concise.

## Building

Run `make` to compile the interpreter. The resulting binary is `interpreter`.

## Testing

The `tests` directory contains simple end-to-end tests that build the
interpreter and run example programs, checking their output against expected
results. Execute `tests/run_tests.sh` from the repository root to run them.
