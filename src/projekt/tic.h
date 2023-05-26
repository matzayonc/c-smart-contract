#include <solana_sdk.h>

class Tic {
public:
   Tic(uint8_t *data) {
        data_ = data;
    }

    void reset() {
        sol_log("reset");

        data_[0] = 0;
        for (int i = 1; i <= 9; i++)
            data_[i] = 2;
    }

    int set(uint8_t field, uint8_t player) {
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

    void print() {
        for (int i = 1; i <= 9; i++) 
            if(data_[i] == 0)
                sol_log("X");
            else if(data_[i] == 1)
                sol_log("O");
            else
                sol_log("_");

    }

    int winner() {
        return data_[0] < 100 ? 2 : data_[0] % 2;
    }
 
private:
    void check() {
        int winner = check_all();
        if(winner != 2) {
            if (winner == 0)
                sol_log("Winner X");
            else
                sol_log("Winner O");
            data_[0] = winner + 100;
        }
    }

    int check_all () {
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

    uint8_t *data_;
};