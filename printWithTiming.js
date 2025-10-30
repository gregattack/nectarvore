function print(msgName,msg) {
    var now = new Date();
    var mins = now.getMinutes();
    var secs = now.getSeconds();
    var milli = now.getMilliseconds();
    post('\n'+mins+':'+secs+':'+milli , '---', msgName, msg);
}