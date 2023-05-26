#include <solana_sdk.h>
#include "tic.h"

Tic::Tic(uint8_t *data) {
    data_ = data;
}

void Tic::reset() {
    sol_log("reset");

    data_[0] = 0;
    for (int i = 1; i <= 9; i++)
        data_[i] = 2;
}

int Tic::set(uint8_t field, uint8_t player) {
    sol_log("set3z");
    if ((data_[0] % 2) != player)
        return -1;

    sol_log("set3a");
    
    uint8_t k = field;
    while (k--)
        sol_log("set3aa");



    if (field < 1 || field > 9)
        return -2;

    sol_log("set3b");

    if(data_[field] != 2)
        return -3;

    sol_log("set3c");
    data_[0]++;
    data_[field] = player;

    check();

    return 0;
}


void Tic::print() const {
    for (int i = 1; i <= 9; i+=3) {
        char p[] = {'_', ' ', '_', ' ', '_'};
        for (int j = 0; j < 3; j++) {
            if (data_[i + j] == 0)
                p[j * 2] = 'X';
            else if (data_[i + j] == 1)
                p[j * 2] = 'O';
        }
        sol_log(p);
    }
}

int Tic::winner() const {
    return data_[0] < 100 ? 2 : data_[0] % 2;
}

void Tic::check() {
    int winner = check_all();
    if(winner != 2) {
        if (winner == 0)
            sol_log("Winner X");
        else
            sol_log("Winner O");
        data_[0] = winner + 100;
    }
}

int Tic::check_all () const {
        for(int i = 1; i <= 9; i += 3)
            if(data_[i] == data_[i + 1] && data_[i + 1] == data_[i + 2] && data_[i] != 2)
                return data_[i];

        for(int i = 1; i <= 3; i++)
            if(data_[i] == data_[i + 3] && data_[i + 3] == data_[i + 6] && data_[i] != 2)
                return data_[i];

        if(data_[1] == data_[5] && data_[5] == data_[9] && data_[1] != 2)
            return data_[1];

        if(data_[3] == data_[5] && data_[5] == data_[7] && data_[3] != 2)
            return data_[3];

        return 2;
    }