var lean = function (content, lang) {
    var r = {};
    var keys = Object.keys(content);
    for (j = 0; j < keys.length; j++) {
        var value = content[keys[j]];
        if (value == undefined)
            r[keys[j]] = undefined;
        else {
            if (lang) {
                if (Array.isArray(value)) {
                    var t = [];
                    for (l = 0; l < value.length; l++) {
                        if (value[l] != undefined) {
                            if (typeof (value[l]) == "object") {
                                var v = value[l];
                                if (v[lang] != undefined) {
                                    if (v[lang].toString().startsWith("http://") || v[lang].toString().startsWith("https://"))
                                        t.push(v[lang].toString().replace("https://app-spanel.herokuapp.com", "https://assets.reqter.com").replace("https://app-spanel.herokuapp.com", "https://assets.reqter.com"));
                                    else if (v[lang].toString().startsWith("/assets"))
                                        t.push("https://assets.reqter.com" + v[lang].toString());
                                    else
                                        t.push("https://assets.reqter.com/asset/download/" + v[lang].toString());
                                } else
                                    t.push(v);
                            } else {
                                if (value[l] != undefined && typeof (value[l]) == "string") {
                                    var y = value[l].toString().replace("https://app-spanel.herokuapp.com", "https://assets.reqter.com");
                                    if (!y.startsWith("http")) {
                                        if (y.startsWith("/assets"))
                                            y = "https://assets.reqter.com" + y;
                                        else
                                            y = "https://assets.reqter.com/asset/download/" + y;
                                    }
                                    t.push(y);
                                } else
                                    t.push(value[l]);
                            }
                        }
                    }
                    r[keys[j]] = t;
                } else
                if (typeof (value) == "object") {
                    if (value[lang] != undefined) {
                        if (value[lang].toString().startsWith("http://") || value[lang].toString().startsWith("https://"))
                            r[keys[j]] = value[lang].toString().replace("https://app-spanel.herokuapp.com", "https://assets.reqter.com").replace("https://assets.herokuapp.com", "https://assets.reqter.com");
                        else if (value[lang].toString().startsWith("/assets"))
                            r[keys[j]] = "https://assets.reqter.com" + value[lang].toString();
                        else
                            r[keys[j]] = "https://assets.reqter.com/asset/download/" + value[lang].toString();
                        r[keys[j]] = value[lang];
                    } else {
                        r[keys[j]] = value;
                    }
                } else

                    r[keys[j]] = value;
            } else
                r[keys[j]] = value;
        }
    }
    return r;
}

function isArray(obj) {
    return Object.prototype.toString.call(obj) === "[object Array]";
}
exports.lean = lean;
exports.isArray = isArray;