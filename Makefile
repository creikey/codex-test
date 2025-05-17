CC?=gcc
CFLAGS?=-O2 -Wall -std=c99

all: interpreter

interpreter: src/interpreter.c
	$(CC) $(CFLAGS) -o interpreter src/interpreter.c

clean:
	rm -f interpreter

.PHONY: all clean
