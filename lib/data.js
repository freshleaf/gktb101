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
    var sql = 'SELECT university.university_code, major.major_code, university_name, major_name, major_line.year' +
        ' , major_line.student_type, major_line.batch, max_score, min_score, average_score, admissions_number, university.is_985, university.is_211, score_line' +
        ' FROM major_line' +
        ' join university on major_line.university_code = university.university_code' +
        ' join major on major_line.major_code = major.major_code' +
        ' LEFT JOIN location_batch_line ON major_line.registration_location_code = location_batch_line.registration_location_code' +
        ' AND major_line.year = location_batch_line.year' +
        ' AND major_line.student_type = location_batch_line.student_type' +
        ' AND major_line.batch = location_batch_line.batch' +
        ' WHERE major_line.registration_location_code = "' + studentLocCode + '"' +
        ' AND major_line.major_code like "' + majorSubclass + '%"' +
        ' AND university.location_code = "' + universityLocCode + '"' +
        ' AND major_line.year > 2014' +
        ' ORDER BY university.university_code, major_line.major_code, major_line.year desc';
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
    var sql = 'SELECT major_line.year, university.university_name, major.major_name, major_line.student_type, major_line.batch' +
        ', major_line.max_score, major_line.min_score, major_line.average_score, score_line, major_line.university_code, major_line.major_code' +
        ' FROM major_line' +
        ' INNER JOIN university ON major_line.university_code = university.university_code' +
        ' INNER JOIN major ON major_line.major_code = major.major_code' +
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