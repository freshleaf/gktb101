var syncMysql = require('sync-mysql');
var credentials = require('../credentials.js');

var connection = new syncMysql({
    host: credentials.db_host,
    user: credentials.db_user,
    password: credentials.db_password,
    port: credentials.db_port,
    database: credentials.db_database,
});

var locations = [];
var majorClasses = [];

exports.getLocations = function () {
    if (locations.length == 0) {
        var sql = 'SELECT * FROM location ORDER BY location_order';
        const results = connection.query(sql);
        if (results) {
            for (var i = 0; i < results.length; i++) {
                var location = {};
                location.name = results[i].location_name;
                location.code = results[i].location_code;
                locations.push(location);
            }
        }
    }
    return locations;
};

exports.getMajorClasses = function () {
    if (majorClasses.length == 0) {
        var sql = 'SELECT * FROM major_class ORDER BY major_class_code;';
        const results = connection.query(sql);
        if (results) {
            for (var i = 0; i < results.length; i++) {
                var majorClass = {};
                majorClass.name = results[i].major_class_name;
                majorClass.code = results[i].major_class_code;
                majorClasses.push(majorClass);
            }
        }
    }
    return majorClasses;
};

exports.getStudentTypes = function () {
    var types = [];
    var type = {};
    type.code = 0;
    type.name = '不限';
    types.push(type);
    type = {};
    type.code = 1;
    type.name = '文科';
    types.push(type);
    type = {};
    type.code = 2;
    type.name = '理科';
    types.push(type);
    type = {};
    type.code = 3;
    type.name = '综合';
    types.push(type);
    return types;
};

exports.getTypeString = function (type = 0) {
    var typeString = '不限';
    if (type == 1) {
        typeString = '文科';
    } else if (type == 2) {
        typeString = '理科';
    } else if (type == 3) {
        typeString = '综合';
    }
    return typeString;
};

exports.getMajorSubClasses = function (majorClassCode = '01') {
    var subClasses = [];
    var sql = 'SELECT * FROM major_subclass WHERE major_class_code = "' + majorClassCode + '" ORDER BY subclass_code;';
    const results = connection.query(sql);
    if (results) {
        for (var i = 0; i < results.length; i++) {
            var majorSubClass = {};
            majorSubClass.name = results[i].subclass_name;
            majorSubClass.code = results[i].subclass_code;
            subClasses.push(majorSubClass);
        }
    }
    return subClasses;
};

exports.getMajors = function (subClassCode) {
    var majors = [];
    if (!subClassCode) {
        return majors;
    }
    var sql = 'SELECT * FROM major WHERE major_subclass_code = "' + subClassCode + '" ORDER BY major_code;';
    const results = connection.query(sql);
    if (results) {
        for (var i = 0; i < results.length; i++) {
            var major = {};
            major.name = results[i].major_name;
            major.code = results[i].major_code;
            majors.push(major);
        }
    }
    return majors;
};

exports.getUniversities = function (locationCode) {
    var sql = 'select university_code, university_name, is_985, is_211, location_name, university.location_code' +
        ' from university join location on university.location_code = location.location_code' +
        ' where (is_211 = true or is_985 = true)';
    if (locationCode) {
        sql = sql + ' and university.location_code = "' + locationCode + '"';
    }
    sql = sql + ' order by location_order, university_code;';
    const results = connection.query(sql);
    return results;
};

exports.getMajorLine = function (studentLocCode, majorSubclass, universityLocCode) {
    var sql = 'SELECT university.university_code, major_line.major_code, university_name, major_name, major_line.year' +
        ' , major_line.student_type, major_line.batch, max_score, min_score, average_score, admissions_number, university.is_985, university.is_211, score_line' +
        ' FROM major_line' +
        ' join university on major_line.university_code = university.university_code' +
        ' LEFT JOIN (select major_code, major_name from major union select subclass_code as major_code, subclass_name as major_name from major_subclass) as m on major_line.major_code = m.major_code' +
        ' LEFT JOIN location_batch_line ON major_line.registration_location_code = location_batch_line.registration_location_code' +
        ' AND major_line.year = location_batch_line.year' +
        ' AND major_line.student_type = location_batch_line.student_type' +
        ' AND major_line.batch = location_batch_line.batch' +
        ' WHERE major_line.registration_location_code = "' + studentLocCode + '"' +
        ' AND major_line.major_code like "' + majorSubclass + '%"' +
        ' AND university.location_code = "' + universityLocCode + '"' +
        ' AND major_line.year > 2014' +
        ' ORDER BY university.university_code, major_line.major_code, major_line.student_type, major_line.year desc';
    const results = connection.query(sql);
    return results;
};

exports.getUniversityLine = function (studentLocCode, universityLocCode) {
    var sql = 'SELECT a.year, a.university_code, a.student_type, a.batch, max_score, min_score, average_score' +
        ', admissions_number, university_name, is_985, is_211, score_line FROM university_line a' +
        ' RIGHT JOIN (SELECT university_code, MAX(year) year, registration_location_code' +
        ' FROM university_line GROUP BY university_code, registration_location_code) b' +
        ' ON a.university_code = b.university_code' +
        ' AND a.year = b.year' +
        ' AND a.registration_location_code = b.registration_location_code' +
        ' INNER JOIN university ON a.university_code = university.university_code' +
        ' LEFT JOIN location_batch_line ON a.registration_location_code = location_batch_line.registration_location_code' +
        ' AND a.year = location_batch_line.year' +
        ' AND a.student_type = location_batch_line.student_type' +
        ' AND a.batch = location_batch_line.batch' +
        ' WHERE university.location_code = "' + universityLocCode + '"' +
        ' AND a.registration_location_code = "' + studentLocCode + '"' +
        ' AND (is_211 = true OR is_985 = true)' +
        ' AND (a.student_type = "文科" or a.student_type = "理科" or a.student_type = "综合")' +
        ' ORDER BY a.university_code ASC';
    const results = connection.query(sql);
    return results;
};

exports.getMajorGoal = function (studentLocCode, universityCode, majorCode, type) {
    var sql = 'SELECT major_line.year, university.university_name, major_name, major_line.student_type, major_line.batch' +
        ', major_line.max_score, major_line.min_score, major_line.average_score, score_line, major_line.university_code, major_line.major_code' +
        ' FROM major_line' +
        ' LEFT JOIN university ON major_line.university_code = university.university_code' +
        ' LEFT JOIN (select major_code, major_name from major union select subclass_code as major_code, subclass_name as major_name from major_subclass) as m on major_line.major_code = m.major_code' +
        ' LEFT JOIN location_batch_line l' +
        ' ON major_line.year = l.year AND major_line.student_type = l.student_type' +
        ' AND major_line.registration_location_code = l.registration_location_code' +
        ' WHERE major_line.registration_location_code = "' + studentLocCode + ' "' +
        ' AND major_line.major_code = "' + majorCode + '"' +
        ' AND major_line.university_code = "' + universityCode + '"';
    if (type === '文科' || type === '理科' || type === '综合') {
        sql = sql + ' AND major_line.student_type = "' + type + '"';
    }
    sql = sql + ' ORDER BY major_line.year DESC';
    const results = connection.query(sql);
    return results;
};

exports.getUniversityGoal = function (studentLocCode, universityCodeList, type) {
    if (!universityCodeList || universityCodeList.length == 0) {
        return [];
    }
    var sql = 'SELECT university.university_code, a.year, university.university_name, a.student_type, a.batch, a.max_score, a.min_score, a.average_score, score_line' +
        ' FROM university_line AS a' +
        ' INNER JOIN university ON a.university_code = university.university_code' +
        ' LEFT JOIN location_batch_line AS l ON a.year = l.year AND a.student_type = l.student_type' +
        ' AND a.registration_location_code = l.registration_location_code' +
        ' WHERE a.registration_location_code = "' + studentLocCode + '"' +
        ' AND a.university_code in (';
    var i;
    for (i = 0; i < universityCodeList.length; i++) {
        universityCodeList[i] = '"' + universityCodeList[i] + '"';
    }
    sql += universityCodeList.join(',') + ')';
    if (type != '不限') {
        sql += ' AND a.student_type = "' + type + '"';
    }
    sql += ' ORDER BY a.university_code ASC, a.student_type, a.year DESC';
    const results = connection.query(sql);
    return results;
};

exports.getLocationScore = function () {
    var sql = 'select year, location_batch_line.registration_location_code as code, location_name as name, student_type as type, score_line as score, location_order from location_batch_line' +
        ' inner join location on location_batch_line.registration_location_code = location.location_code' +
        ' where year>2004' +
        ' order by student_type, location_order, year';
    const results = connection.query(sql);
    return results;
};

exports.getPredictLocationLine = function () {
    var predictMap = new Map([['北京_文科', 499], ['北京_理科', 491], ['上海_综合', 410], ['重庆_文科', 545], ['重庆_理科', 555]
        , ['安徽_文科', 559], ['安徽_理科', 522], ['福建_文科', 558], ['福建_理科', 502], ['广东_文科', 468], ['广东_理科', 397]
        , ['甘肃_文科', 514], ['甘肃_理科', 492], ['广西_文科', 531], ['广西_理科', 501], ['贵州_文科', 548], ['贵州_理科', 473]
        , ['河北_文科', 578], ['河北_理科', 526], ['湖北_文科', 532], ['湖北_理科', 517], ['黑龙江_文科', 499], ['黑龙江_理科', 479]
        , ['海南_文科', 621], ['海南_理科', 582], ['河南_文科', 547], ['河南_理科', 513], ['湖南_文科', 566], ['湖南_理科', 530]
        , ['吉林_文科', 543], ['吉林_理科', 537], ['江苏_文科', 337], ['江苏_理科', 352], ['江西_文科', 528], ['江西_理科', 531]
        , ['辽宁_文科', 502], ['辽宁_理科', 389], ['内蒙古_文科', 502], ['内蒙古_理科', 483], ['宁夏_文科', 506], ['宁夏_理科', 468]
        , ['青海_文科', 439], ['青海_理科', 396], ['四川_文科', 559], ['四川_理科', 541], ['山东_文科', 515], ['山东_理科', 447]
        , ['山西_文科', 541], ['山西_理科', 525], ['陕西_文科', 524], ['陕西_理科', 479], ['天津_文科', 450], ['天津_理科', 435]
        , ['新疆_文科', 487], ['新疆_理科', 470], ['西藏_文科', 474], ['西藏_理科', 459], ['云南_文科', 548], ['云南_理科', 523]
        , ['浙江_综合', 590]]);
    return predictMap;
};

exports.getLocationScoreByName = function (locationName) {
    var sql = 'select year, location_batch_line.registration_location_code as code, location_name as name, student_type as type, score_line as score, location_order from location_batch_line' +
        ' inner join location on location_batch_line.registration_location_code = location.location_code' +
        ' where location_name = "' + locationName + '"' +
        ' order by year DESC, student_type;';
    const results = connection.query(sql);
    return results;
};

exports.getAllUniversitiesWithLocation = function () {
    var sql = 'select university_code as code, university_name as name, location_name from university' +
        ' left join location on university.location_code = location.location_code' +
        ' where is_211 = true or is_985 = true' +
        ' order by location_order';
    const results = connection.query(sql);
    return results;
};

exports.getUniversitiesByName = function (universityName) {
    var sql = 'select university_name as name, university_code as code, location_name, alias, is_985, is_211 from university' +
        ' left join location on university.location_code = location.location_code' +
        ' where university_name like ' + '"%' + universityName + '%"' +
        ' or alias like ' + '"%' + universityName + '%";';
    const results = connection.query(sql);
    return results;
};

exports.getUnversityByCode = function (universityCode) {
    var sql = 'select university_name as name, university_code as code, location_name, alias, is_985, is_211 from university' +
        ' left join location on university.location_code = location.location_code' +
        ' where university_code = "' + universityCode + '";';
    const results = connection.query(sql);
    return results;
};

exports.getUniversityScoreByCode = function (universityCode, locationCode) {
    var sql = 'select year, student_type, batch, max_score, min_score, average_score, admissions_number, location_name from university_line' +
        ' left join location on registration_location_code = location.location_code' +
        ' where university_code = "' + universityCode + '"' +
        ' and registration_location_code = "' + locationCode + '"' +
        ' order by year desc, student_type;';
    const results = connection.query(sql);
    return results;
};

exports.getAllMajors = function () {
    var sql = 'select major_code as code, major_name as name from major' +
        ' union' +
        ' select subclass_code as code, subclass_name as name from major_subclass' +
        ' union' +
        ' select major_class_code as code, major_class_name as name from major_class' +
        ' order by code';
    const results = connection.query(sql);
    return results;
};

exports.getMajorsByName = function (majorName) {
    var sql = 'select subclass_code as code, subclass_name as name from major_subclass' +
        ' where subclass_name like "%' + majorName + '%"' +
        ' union' +
        ' select major_code as code, major_name as name from major' +
        ' where major_name like "%' + majorName + '%"' +
        ' order by code';
    const results = connection.query(sql);
    return results;
};

exports.getMajorByCode = function (majorCode) {
    var sql = 'select subclass_code as code, subclass_name as name from major_subclass' +
        ' where subclass_code = "' + majorCode + '"' +
        ' union' +
        ' select major_code as code, major_name as name from major' +
        ' where major_code = "' + majorCode + '"';
    const results = connection.query(sql);
    return results;
};

exports.getAllMajorScore = function (majorCode, locCode) {
    var sql = 'select location_name, year, university_name, student_type, batch, max_score, min_score, average_score, admissions_number from major_line' +
        ' left join university on major_line.university_code = university.university_code' +
        ' left join location on university.location_code = location.location_code' +
        ' where major_code = "' + majorCode + '"' +
        ' and registration_location_code = "' + locCode + '"' +
        ' order by location_order, major_line.university_code, student_type, year desc';
    const results = connection.query(sql);
    return results;
};

exports.getSameSubClassMajors = function (majorCode) {
    var code = majorCode;
    if (majorCode && majorCode.length == 6) {
        code = majorCode.substr(0, 4);
    }
    var sql = 'select subclass_code as code, subclass_name as name from major_subclass' +
        ' where subclass_code like "' + code + '%"' +
        ' union' +
        ' select major_code as code, major_name as name from major' +
        ' where major_code like "' + code + '%"';
    const results = connection.query(sql);
    return results;
};