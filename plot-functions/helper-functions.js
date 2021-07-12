function unpack(data, key) {
    let arr = data[0].map( (row) => row[key] );
    for (let i = 1; i < data.length; i++) {
        arr = arr.concat( data[i].map( (row) => row[key] ) );
    }
    return arr;
    /*fix with web server local host 8000 by running python -m http.server on git bash*/
}
