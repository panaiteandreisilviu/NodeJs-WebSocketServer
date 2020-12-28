# Returns {SERVER_DOWNLOAD_IN_BYTES SERVER_UPLOAD_IN_BYTES}
awk '/ens3/ {i++; rx[i]=$2; tx[i]=$10}; END{print rx[2]-rx[1] " " tx[2]-tx[1]}' <(cat /proc/net/dev; sleep 1; cat /proc/net/dev)