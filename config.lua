function add_numbers(a, b)
    local sum = a + b
    print("Sum:", sum)
    return 0
end

c = {}

c.funcs = {
    add = add_numbers
}
