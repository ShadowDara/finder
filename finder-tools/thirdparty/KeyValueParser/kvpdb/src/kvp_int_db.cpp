#include <kvpdb/kvp_int_db.hpp>


void KeyValueDBSInt::write_map(const std::unordered_map<std::string, int32_t>& map, const std::string& filename) {
    std::ofstream out(filename, std::ios::binary);
    if (!out) {
        throw std::runtime_error("Datei konnte nicht geöffnet werden!");
    }

    for (const auto& [key, value] : map) {
        uint32_t key_len = static_cast<uint32_t>(key.size());

        // Schreibe Key-Länge (little endian)
        uint8_t len_bytes[4] = {
            static_cast<uint8_t>(key_len & 0xFF),
            static_cast<uint8_t>((key_len >> 8) & 0xFF),
            static_cast<uint8_t>((key_len >> 16) & 0xFF),
            static_cast<uint8_t>((key_len >> 24) & 0xFF)
        };
        out.write(reinterpret_cast<char*>(len_bytes), 4);

        // Schreibe Key-Bytes
        out.write(key.data(), key_len);

        // Schreibe Value (little endian)
        uint8_t val_bytes[4] = {
            static_cast<uint8_t>(value & 0xFF),
            static_cast<uint8_t>((value >> 8) & 0xFF),
            static_cast<uint8_t>((value >> 16) & 0xFF),
            static_cast<uint8_t>((value >> 24) & 0xFF)
        };
        out.write(reinterpret_cast<char*>(val_bytes), 4);
    }

    out.close();
}


std::unordered_map<std::string, int32_t> KeyValueDBSInt::read_map(const std::string& filename) {
    std::unordered_map<std::string, int32_t> map;
    std::ifstream in(filename, std::ios::binary);
    if (!in) {
        throw std::runtime_error("Could not open File!");
    }

    while (in.peek() != EOF) {
        uint8_t len_bytes[4];
        if (!in.read(reinterpret_cast<char*>(len_bytes), 4)) break;

        uint32_t key_len = len_bytes[0] | (len_bytes[1] << 8) | (len_bytes[2] << 16) | (len_bytes[3] << 24);

        std::string key(key_len, '\0');
        in.read(&key[0], key_len);

        uint8_t val_bytes[4];
        in.read(reinterpret_cast<char*>(val_bytes), 4);
        int32_t value = val_bytes[0] | (val_bytes[1] << 8) | (val_bytes[2] << 16) | (val_bytes[3] << 24);

        map[key] = value;
    }

    return map;
}

bool KeyValueDBSInt::acquire_lock(const std::string& lockfile, int timeout_ms) {
    auto start = std::chrono::steady_clock::now();
    while (std::filesystem::exists(lockfile)) {
        std::this_thread::sleep_for(std::chrono::milliseconds(50));
        auto now = std::chrono::steady_clock::now();
        if (std::chrono::duration_cast<std::chrono::milliseconds>(now - start).count() > timeout_ms)
            return false; // Timeout
    }

    // Lock erzeugen
    std::ofstream lock(lockfile);
    if (!lock) return false;
    lock << "locked\n";
    lock.close();
    return true;
}

void KeyValueDBSInt::release_lock(const std::string& lockfile) {
    std::filesystem::remove(lockfile);
}
