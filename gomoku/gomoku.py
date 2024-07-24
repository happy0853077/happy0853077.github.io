#!/usr/bin/env python

from requests import get
from re import match


def main():

    print("python gomoku by Happy0853077\nPowered by Aurora API\n\npress enter to start\n\ntype help to get help\n")

    if input() == "help":
        help()
    else:
        gomoku()


def gomoku():

    url = "https://api.andeer.top/API/private_wuziq.php?"

    id_hash = get(url, params={"type": "set", "id_hash": "abc", "position": "a1"}).json()["data"]["id_hash"]

    letter2num = lambda letter: ord(letter) - 96
    num2letter = lambda num: chr(int(num) + 96)

    _map = []
    for i in range(15):
        _map.append([])
        for j in range(15):
            _map[i].append(" ")

    last = 0

    while True:

        show(_map)

        while True:
            _position = input("place on: ")
            if bool(match(r'^[a-o](1[0-5]|[1-9])$', _position)):
                position = num2letter(_position[1:]) + str(letter2num(_position[0]))
                if _map[letter2num(position[0]) - 1][int(position[1:]) - 1] == " ":
                    _map[letter2num(position[0]) - 1][int(position[1:]) - 1] = "0"
                    break
                else:
                    print("this position has been taken")
            else:
                print("invalid position")

        response = get(url, params={"type": "set", "id_hash": id_hash, "position": position})
        data = response.json()

        if data is None:
            won = False
            break

        try:
            comp = data["data"]["last_step"]
        except KeyError:
            won = True
            _map[letter2num(last[0]) - 1][int(last[1:]) - 1] = "\033[48;5;15m\033[30mx\033[0m"
            show(finish(_map, _position))
            break

        _map[letter2num(comp[0]) - 1][int(comp[1:]) - 1] = "\033[48;5;15m\033[31mx\033[0m"

        if last != 0:
            _map[letter2num(last[0]) - 1][int(last[1:]) - 1] = "\033[48;5;15m\033[30mx\033[0m"
        last = comp

    if won == True:
        print("you win!")
    if won == False:
        print("you lose~")
    exit()


def help():
    print("\n" * 2)
    input("this is a terminal-based program to play gomoku against computer\n")
    input("you will see the board like this:\n")
    _map = [[" ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " "], 
            [" ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " "], 
            [" ", " ", " ", " ", " ", " ", "0", " ", " ", " ", " ", " ", " ", " ", " "], 
            [" ", " ", " ", " ", " ", "\033[48;5;15m\033[31mx\033[0m", "\033[48;5;15m\033[30mx\033[0m", " ", " ", " ", "\033[48;5;15m\033[30mx\033[0m", " ", " ", " ", " "], 
            [" ", " ", " ", " ", " ", " ", "\033[48;5;15m\033[30mx\033[0m", "0", "0", "0", " ", " ", " ", " ", " "], 
            [" ", " ", " ", " ", " ", " ", "\033[48;5;15m\033[30mx\033[0m", "\033[48;5;15m\033[30mx\033[0m", "0", " ", " ", " ", " ", " ", " "], 
            [" ", " ", " ", " ", " ", " ", "\033[48;5;15m\033[30mx\033[0m", "0", " ", " ", " ", " ", " ", " ", " "], 
            [" ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " "], 
            [" ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " "], 
            [" ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " "], 
            [" ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " "], 
            [" ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " "], 
            [" ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " "], 
            [" ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " "], 
            [" ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " "]]
    show(_map)
    input(" 0   this is your stone(black),\n")
    input(" \033[48;5;15m\033[30mx\033[0m   this is the computer's stone(white),\n")
    input(" \033[48;5;15m\033[31mx\033[0m   this is the computer's last step,\n")
    input("to place the stone, you need to type the letter of the row and the number of the column,\n")
    input("example: e3, a5, m12\n")
    input("now you have known the basic rules, have fun! :)\n\n")
    main()


def finish(_map, pos):

    col = ord(pos[0]) - 97
    row = int(pos[1:]) - 1

    line = [(row, col)]
    try:
        for i in range(4):
            if _map[row][col + i + 1] == "0":
                line.append((row, col + i + 1))
            else:
                break

        if len(line) == 5:
            for _pos in line:
                _map[_pos[0]][_pos[1]] = "\033[42m\033[30m0\033[0m"
            return _map

    except IndexError:
        pass

    line = [(row, col)]
    try:
        for i in range(4):
            if _map[row + i + 1][col + i + 1] == "0":
                line.append((row + i + 1, col + i + 1))
            else:
                break

        if len(line) == 5:
            for _pos in line:
                _map[_pos[0]][_pos[1]] = "\033[42m\033[30m0\033[0m"
            return _map

    except IndexError:
        pass

    line = [(row, col)]
    try:
        for i in range(4):
            if _map[row + i + 1][col] == "0":
                line.append((row + i + 1, col))
            else:
                break

        if len(line) == 5:
            for _pos in line:
                _map[_pos[0]][_pos[1]] = "\033[42m\033[30m0\033[0m"
            return _map

    except IndexError:
        pass

    line = [(row, col)]
    try:
        for i in range(4):
            if _map[row + i + 1][col - i - 1] == "0":
                line.append((row + i + 1, col - i - 1))
            else:
                break

        if len(line) == 5:
            for _pos in line:
                _map[_pos[0]][_pos[1]] = "\033[42m\033[30m0\033[0m"
            return _map

    except IndexError:
        pass

    line = [(row, col)]
    try:
        for i in range(4):
            if _map[row][col - i - 1] == "0":
                line.append((row, col - i - 1))
            else:
                break

        if len(line) == 5:
            for _pos in line:
                _map[_pos[0]][_pos[1]] = "\033[42m\033[30m0\033[0m"
            return _map

    except IndexError:
        pass

    line = [(row, col)]
    try:
        for i in range(4):
            if _map[row - i - 1][col - i - 1] == "0":
                line.append((row - i - 1, col - i - 1))
            else:
                break

        if len(line) == 5:
            for _pos in line:
                _map[_pos[0]][_pos[1]] = "\033[42m\033[30m0\033[0m"
            return _map

    except IndexError:
        pass

    line = [(row, col)]
    try:
        for i in range(4):
            if _map[row - i - 1][col] == "0":
                line.append((row - i - 1, col))
            else:
                break

        if len(line) == 5:
            for _pos in line:
                _map[_pos[0]][_pos[1]] = "\033[42m\033[30m0\033[0m"
            return _map

    except IndexError:
        pass

    line = [(row, col)]
    try:
        for i in range(4):
            if _map[row - i - 1][col + i + 1] == "0":
                line.append((row - i - 1, col + i + 1))
            else:
                break

        if len(line) == 5:
            for _pos in line:
                _map[_pos[0]][_pos[1]] = "\033[42m\033[30m0\033[0m"
            return _map

    except IndexError:
        pass


def show(_map):
    print("   a b c d e f g h i j k l m n o")
    for i in range(9):
        print(" " + str(i + 1) +" " + "-".join(_map[i]))
        print("  " + " |" * 15)
    for i in range(5):
        print(str(i + 10) +" " + "-".join(_map[i + 9]))
        print("  " + " |" * 15)
    print("15 " + "-".join(_map[14]))


if __name__ == "__main__":
    main()
