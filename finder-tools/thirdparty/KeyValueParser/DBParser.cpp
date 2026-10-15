#include <iostream>
#include <unordered_map>
#include <fstream>
#include <sstream>
#include <vector>

#include <kvpdb/kvpdb.hpp>
#include <kvpdb/kvp_singledb.hpp>

//using namespace kvpdb;
using namespace KVPDB;


int main() {
    KeyValueDB<default_db_struct> db;

    db.put("apple", default_db_struct("fruit"));
    db.put("banana", default_db_struct("fruit"));
    db.put("carrot", default_db_struct("vegetable"));

    std::cout << "Initial DB:\n";
    db.printAll();

    db.save("db.txt");

    KeyValueDB<default_db_struct> db2;
    db2.load("db.txt");

    std::cout << "\nGeladene DB:\n";
    db2.printAll();

    default_db_struct value;
    if (db2.get("apple", value)) {
        std::cout << "\napple => " << value.tempname << "\n";
    }

    std::cout << "\nIndex (a):\n";
    for (const auto& key : db2.getByFirstChar('a')) {
        std::cout << key << "\n";
    }


    auto db3 = KVPSDB::SingleValueDB("name");
    db3.put(KVPSDB::default_db_struct("jjj"));
    KVPSDB::default_db_struct val;
    db3.get(val);
    std::cout << val.tempname << std::endl;

    return 0;
}
