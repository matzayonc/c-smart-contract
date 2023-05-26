#include <solana_sdk.h>

class Tic {
public:
    Tic(uint8_t *data);

    void reset();
    int set(uint8_t field, uint8_t player);
    void print() const;
    int winner() const;
 
private:
    void check();
    int check_all() const;

    uint8_t *data_;
};