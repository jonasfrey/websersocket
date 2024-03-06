pid_websersocket=$(pgrep -f "websersocket_{s_uuidv4}.js")
watch -n 1 ps -p $pid_websersocket -o pid,etime,%cpu,%mem,cmd