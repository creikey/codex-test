#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

#define MAX_VARS 256
#define MAX_NAME 32

/* simple variable table */
typedef struct {
    char name[MAX_NAME];
    int value;
} Var;

static Var vars[MAX_VARS];
static int var_count = 0;

static Var *get_var(const char *name) {
    for (int i = 0; i < var_count; ++i) {
        if (strcmp(vars[i].name, name) == 0) {
            return &vars[i];
        }
    }
    if (var_count < MAX_VARS) {
        strncpy(vars[var_count].name, name, MAX_NAME-1);
        vars[var_count].name[MAX_NAME-1] = '\0';
        vars[var_count].value = 0;
        return &vars[var_count++];
    }
    return NULL;
}

/* very small expression evaluator */
static int eval_expr(char **s);

static void skip_ws(char **s) {
    while (isspace(**s)) (*s)++;
}

static int parse_number(char **s) {
    skip_ws(s);
    int val = 0;
    while (isdigit(**s)) {
        val = val * 10 + (**s - '0');
        (*s)++;
    }
    return val;
}

static int parse_term(char **s) {
    skip_ws(s);
    if (isalpha(**s)) {
        char name[MAX_NAME];
        int idx = 0;
        while (isalpha(**s) && idx < MAX_NAME-1) {
            name[idx++] = **s;
            (*s)++;
        }
        name[idx] = '\0';
        Var *v = get_var(name);
        return v ? v->value : 0;
    } else if (isdigit(**s)) {
        return parse_number(s);
    }
    return 0;
}

static int eval_expr(char **s) {
    int val = parse_term(s);
    skip_ws(s);
    while (**s == '+' || **s == '-') {
        char op = **s; (*s)++;
        int rhs = parse_term(s);
        val = (op == '+') ? val + rhs : val - rhs;
        skip_ws(s);
    }
    return val;
}

static void handle_line(char *line) {
    char *s = line;
    skip_ws(&s);
    if (*s == '\0' || *s == '#') return; /* comment or empty */

    if (strncmp(s, "print", 5) == 0 && isspace(s[5])) {
        s += 5;
        int val = eval_expr(&s);
        printf("%d\n", val);
        return;
    }

    /* assignment */
    char name[MAX_NAME];
    int idx = 0;
    while (isalpha(*s) && idx < MAX_NAME-1) {
        name[idx++] = *s;
        s++;
    }
    name[idx] = '\0';
    skip_ws(&s);
    if (*s == '=') {
        s++;
        int val = eval_expr(&s);
        Var *v = get_var(name);
        if (v) v->value = val;
    }
}

int main(int argc, char **argv) {
    if (argc != 2) {
        fprintf(stderr, "Usage: %s <script>\n", argv[0]);
        return 1;
    }
    FILE *f = fopen(argv[1], "r");
    if (!f) {
        perror("open");
        return 1;
    }
    char line[256];
    while (fgets(line, sizeof(line), f)) {
        handle_line(line);
    }
    fclose(f);
    return 0;
}

