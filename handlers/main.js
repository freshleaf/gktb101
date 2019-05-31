var mysql = require('mysql');
var connection;
const data = require('../lib/data.js');

// express-mysql-session
// https://github.com/chill117/express-mysql-session

function openConnection() {
    connection = mysql.createConnection({
        host: 'localhost',
        user: 'gktb',
        password: 'ggyy@GKTB101',
        port: '3306',
        database: 'GKTB'
    });
    connection.connect();
}

function closeConnection() {
    connection.end();
}

function formatScore(score) {
    if (score) {
        return score;
    }
    return '--';
}

exports.home = function (req, res) {
    res.render('home');
};

exports.location_line = function (req, res) {
    var code = req.query.location;
    var whereCondition = null;
    if (code) {
        whereCondition = 'WHERE location_batch_line.registration_location_code = ? ';
    }

    openConnection();
    var sql = 'SELECT * FROM location_batch_line left join location ' +
        'on location_batch_line.registration_location_code = location.location_code ';
    if (whereCondition) {
        sql = sql + whereCondition;
    }
    sql = sql + 'ORDER BY year DESC';

    connection.query(sql, code, function (err, results) {
        if (err) {
            console.log('[SELECT ERROR] - ', err.message);
        }
        var scorelineList = [];
        if (results) {
            for (var i = 0; i < results.length; i++) {
                var scoreline = {};
                scoreline.year = results[i].year;
                scoreline.no = i + 1;
                scoreline.location = results[i].location_name;
                scoreline.student_type = results[i].student_type;
                scoreline.batch = results[i].batch;
                scoreline.socre = results[i].score_line;
                scorelineList.push(scoreline);
            }
        }
        res.render('score_line_location', {location: data.getLocations(), scoreline: scorelineList});
    });
    closeConnection();
};

var createSessionSetting = function () {
    var setting = {};
    setting.sl = 11; // first item: 北京
    setting.type = 0;
    setting.inputScore = 600;
    return setting;
};

exports.setGoal = function (req, res) {
    var i, length = 0;
    var temp = {};

    if (!req.session.usersetting) {
        req.session.usersetting = createSessionSetting();
    }
    if (req.query.sl) {
        req.session.usersetting.sl = req.query.sl;
    }

    var locations = data.getLocations();
    var studentLocs = [];
    var universityLocs = [];
    var selectedUniversityLoc;
    if (locations) {
        length = locations.length;
    }
    for (i = 0; i < length; i++) {
        var location = locations[i];
        temp = {};
        temp.name = location.name;
        temp.code = location.code;
        if (temp.code == req.session.usersetting.sl) {
            temp.selected = ' selected';
        } else {
            temp.selected = '';
        }
        studentLocs.push(temp);

        if (i == 0) {
            selectedUniversityLoc = location.code;
        }
        var temp2 = {};
        temp2.name = location.name;
        temp2.code = location.code;
        if (temp2.code == req.query.ul) {
            temp2.selected = ' selected';
            selectedUniversityLoc = temp2.code;
        } else {
            temp2.selected = '';
        }
        universityLocs.push(temp2);
    }

    var types = data.getStudentTypes();
    if (req.query.type) {
        for (i = 0; i < types.length; i++) {
            var type = types[i];
            if (type.code == req.query.type) {
                type.selected = ' selected';
            } else {
                type.selected = '';
            }
        }
    }

    var majorClasses = data.getMajorClasses();
    var myMajorClasses = [];
    length = 0;
    var majorClassCode;
    if (majorClasses) {
        length = majorClasses.length;
    }
    for (i = 0; i < length; i++) {
        var majorClass = majorClasses[i];
        temp = {};
        temp.code = majorClass.code;
        temp.name = majorClass.name;
        if (i == 0) {
            majorClassCode = temp.code;
        }
        if (temp.code == req.query.class) {
            temp.selected = ' selected';
            majorClassCode = majorClass.code;
        } else {
            temp.selected = '';
        }
        myMajorClasses.push(temp);
    }

    var subClasses = data.getMajorSubClasses(majorClassCode);
    var subClassCode;
    if (subClasses && subClasses.length > 0) {
        subClassCode = subClasses[0].code;
        if (req.query.subClass) {
            for (i = 0; i < subClasses.length; i++) {
                var subClass = subClasses[i];
                if (subClass.code == req.query.subClass) {
                    subClass.selected = ' selected';
                    subClassCode = subClass.code;
                } else {
                    subClass.selected = '';
                }
            }
        }
    }

    var majors = data.getMajors(subClassCode);
    var myUniversities = data.getUniversities(selectedUniversityLoc);

    var isShowEmptyResult = false;
    var scoreLine = [];
    if (req.query.sl && majorClassCode && subClassCode && req.query.ul) {
        var majorLines = [];
        var universityLines = [];
        majorLines = data.getMajorLine(req.query.sl, subClassCode, req.query.ul);
        universityLines = data.getUniversityLine(req.query.sl, req.query.ul);
        var j = 0, lengthUniversity = 0, lengthMajor = 0;
        if (universityLines) {
            lengthUniversity = universityLines.length;
        }
        var tempUniversityCode;
        var score = {};
        var goalItemList = [];
        if (req.session.goal && req.session.goal.items) {
            goalItemList = req.session.goal.items;
        }
        for (i = 0; i < lengthUniversity; i++) {
            var university = universityLines[i];
            var universityScore = {};
            universityScore.year = university.year;
            universityScore.studentType = university.student_type;
            universityScore.batch = university.batch;
            universityScore.maxScore = formatScore(university.max_score);
            universityScore.minScore = formatScore(university.min_score);
            universityScore.averageScore = formatScore(university.average_score);
            universityScore.admissionsNumber = university.admissions_number;
            universityScore.provinceLine = formatScore(university.score_line);
            universityScore.label = university.university_code + '_0_' + university.student_type;
            j = goalItemList.indexOf(universityScore.label);
            if (j >= 0) {
                universityScore.isGoal = true;
            }
            if (tempUniversityCode === university.university_code) {
                score.universityScore.push(universityScore);
                score.itemCount = score.itemCount + 1;
            } else {
                tempUniversityCode = university.university_code;
                score = {};
                score.universityCode = university.university_code;
                score.universityName = university.university_name;
                score.is985 = university.is_985;
                score.is211 = university.is_211;
                score.universityScore = [];
                score.universityScore.push(universityScore);
                score.itemCount = 1;
                scoreLine.push(score);
            }
        }
        if (majorLines) {
            lengthMajor = majorLines.length;
        }
        for (i = 0; i < lengthMajor; i++) {
            var major = majorLines[i];
            var majorScore = {};
            majorScore.majorCode = major.major_code;
            majorScore.majorName = major.major_name;
            majorScore.year = major.year;
            majorScore.studentType = major.student_type;
            majorScore.batch = major.batch;
            majorScore.maxScore = formatScore(major.max_score);
            majorScore.minScore = formatScore(major.min_score);
            majorScore.averageScore = formatScore(major.average_score);
            majorScore.admissionsNumber = major.admissions_number;
            majorScore.provinceLine = formatScore(major.score_line);
            majorScore.label = major.university_code + '_' + major.major_code + '_' + major.student_type;
            j = goalItemList.indexOf(majorScore.label);
            if (j >= 0) {
                majorScore.isGoal = true;
            }
            var isFound = false;
            for (j = 0; j < scoreLine.length; j++) {
                score = scoreLine[j];
                if (score.universityCode === major.university_code) {
                    if (!score.majorScore) {
                        score.majorScore = [];
                    }
                    score.majorScore.push(majorScore);
                    score.itemCount = score.itemCount + 1;
                    isFound = true;
                }
            }
            if (!isFound) {
                score = {};
                score.universityCode = major.university_code;
                score.universityName = major.university_name;
                score.is985 = major.is_985;
                score.is211 = major.is_211;
                score.majorScore = [];
                score.majorScore.push(majorScore);
                scoreLine.push(score);
                score.itemCount = 1;
            }
        }
        for (i = 0; i < scoreLine.length; i++) {
            score = scoreLine[i];
            if (score.majorScore) {
                score.majorScore[0].isFirstLine = true;
            } else if (score.universityScore) {
                score.universityScore[0].isFirstLine = true;
            }
        }

        if (scoreLine.length == 0) {
            isShowEmptyResult = true;
        }
    }

    res.render('setGoal', {
        location: studentLocs,
        type: types,
        majorClass: myMajorClasses,
        majorSubClass: subClasses,
        major: majors,
        universityLoc: universityLocs,
        university: myUniversities,
        scoreLine: scoreLine,
        isShowEmpty: isShowEmptyResult
    });
};

exports.changeGoal = function (req, res) {
    var item;
    var i;
    if (req.query.label) {
        item = req.query.label;
    } else {
        res.send('error');
        return;
    }

    if (!req.session.goal) {
        req.session.goal = {};
        req.session.goal.items = [];
    }
    if ('add' === req.query.action) {
        var i = req.session.goal.items.indexOf(item);
        if (i < 0) {
            req.session.goal.items.push(item);
        }
    }
    if ('del' === req.query.action) {
        i = req.session.goal.items.indexOf(item);
        if (i >= 0) {
            req.session.goal.items.splice(i, 1);
        }
    }
    req.session.goal.type1 = 0;
    req.session.goal.type2 = 0;
    req.session.goal.type3 = 0;
    for (i = 0; i < req.session.goal.items.length; i++) {
        item = req.session.goal.items[i];
        if (item.indexOf('文科') >= 0) {
            req.session.goal.type1 = req.session.goal.type1 + 1;
        }
        if (item.indexOf('理科') >= 0) {
            req.session.goal.type2 = req.session.goal.type2 + 1;
        }
        if (item.indexOf('综合') >= 0) {
            req.session.goal.type3 = req.session.goal.type3 + 1;
        }
    }
    res.send(req.session.goal.items.length.toString());
};

exports.resetGoal = function (req, res) {
    if (req.session.goal) {
        if (req.session.goal.items) {
            req.session.goal = {};
            req.session.goal.items = [];
            req.session.goal.type1 = 0;
            req.session.goal.type2 = 0;
            req.session.goal.type3 = 0;
            res.send('refresh');
            return;
        }
    }
    res.send('OK');
};

exports.doMatch = function (req, res) {
    var studentLocs = [];
    var i, j;
    var temp;

    if (!req.session.usersetting) {
        req.session.usersetting = createSessionSetting();
    }
    if (req.query.sl) {
        req.session.usersetting.sl = req.query.sl;
    }
    if (req.query.type || req.query.type == 0) {
        req.session.usersetting.type = req.query.type;
    }

    var locations = data.getLocations();
    var length = 0;
    if (locations) {
        length = locations.length;
    }
    for (i = 0; i < length; i++) {
        var location = locations[i];
        temp = {};
        temp.name = location.name;
        temp.code = location.code;
        if (temp.code == req.session.usersetting.sl) {
            temp.selected = ' selected';
        } else {
            temp.selected = '';
        }
        studentLocs.push(temp);
    }
    var types = data.getStudentTypes();
    for (i = 0; i < types.length; i++) {
        temp = types[i];
        if (temp.code == req.session.usersetting.type) {
            temp.selected = ' selected';
        } else {
            temp.selected = '';
        }
    }
    if (req.query.inputScore) {
        req.session.usersetting.inputScore = req.query.inputScore;
    }
    if (!(req.session.usersetting.inputScore > 200 && req.session.usersetting.inputScore < 800)) {
        // invalid input score
        res.render('doMatch', {
            location: studentLocs,
            type: types,
            invalidScore: true,
        });
        return;
    }

    // get data
    var goalMajors = [];
    var goalUniversities = [];
    var type = data.getTypeString(req.session.usersetting.type);
    var universityGoalSize = 0;
    var majorGoalSize = 0;
    var universityGoalCodeList = [];

    if (req.session.goal && req.session.goal.items) {
        for (i = 0; i < req.session.goal.items.length; i++) {
            var item = req.session.goal.items[i];
            var parts = item.split('_');
            var goal = {};
            if (parts[1] === '0') {
                // university goal
                goal.location = req.session.usersetting.sl;
                goal.university = parts[0];
                goal.type = parts[2];
                universityGoalSize += 1;
                if (goal.type == type || type === '不限') {
                    goalUniversities.push(goal);
                    universityGoalCodeList.push(goal.university);
                }
            } else {
                // major goal
                goal.location = req.session.usersetting.sl;
                goal.university = parts[0];
                goal.major = parts[1];
                goal.type = parts[2];
                majorGoalSize += 1;
                if (goal.type == type || type === '不限') {
                    goalMajors.push(goal);
                }
            }
        }
    }

    var isShowEmptyResult = false;
    var tempList = [];
    var goalMajorList;
    var goalTemp;
    for (i = 0; i < goalMajors.length; i++) {
        temp = goalMajors[i];
        goalMajorList = data.getMajorGoal(temp.location, temp.university, temp.major, temp.type);
        var firstLineGoal;
        for (j = 0; j < goalMajorList.length; j++) {
            goalTemp = {};
            goalTemp.isMajorGoal = true;
            goalTemp.universityName = goalMajorList[j].university_name;
            goalTemp.year = goalMajorList[j].year;
            goalTemp.majorName = goalMajorList[j].major_name;
            goalTemp.studentType = goalMajorList[j].student_type;
            goalTemp.batch = goalMajorList[j].batch;
            goalTemp.maxScore = formatScore(goalMajorList[j].max_score);
            goalTemp.minScore = formatScore(goalMajorList[j].min_score);
            goalTemp.averageScore = formatScore(goalMajorList[j].average_score);
            goalTemp.admissionsNumber = goalMajorList[j].admissions_number;
            goalTemp.provinceLine = formatScore(goalMajorList[j].score_line);
            if (j == 0) {
                goalTemp.isFirstLine = true;
                goalTemp.historyRecords = [];
                firstLineGoal = goalTemp;
                tempList.push(goalTemp);
            } else {
                firstLineGoal.historyRecords.push(goalTemp);
            }
        }
    }
    var matchedMajorGoalSize = tempList.length;
    var goalUniversityList = data.getUniversityGoal(req.session.usersetting.sl, universityGoalCodeList, type);
    var lastUniversity, lastType;
    for (i = 0; i < goalUniversityList.length; i++) {
        goalTemp = {};
        goalTemp.isMajorGoal = false;
        goalTemp.universityName = goalUniversityList[i].university_name;
        goalTemp.year = goalUniversityList[i].year;
        goalTemp.studentType = goalUniversityList[i].student_type;
        goalTemp.batch = goalUniversityList[i].batch;
        goalTemp.maxScore = formatScore(goalUniversityList[i].max_score);
        goalTemp.minScore = formatScore(goalUniversityList[i].min_score);
        goalTemp.averageScore = formatScore(goalUniversityList[i].average_score);
        goalTemp.admissionsNumber = goalUniversityList[i].admissions_number;
        goalTemp.provinceLine = formatScore(goalUniversityList[i].score_line);
        if (type == '不限') {
            var isHit = false;
            // when type = '不限', got more records from db, remove them
            for (j = 0; j < goalUniversities.length; j++) {
                if (goalUniversityList[i].university_code == goalUniversities[j].university
                    && goalTemp.studentType == goalUniversities[j].type) {
                    isHit = true;
                    continue;
                }
            }
            if (!isHit) {
                continue;
            }
        }
        if (lastUniversity != goalTemp.universityName || lastType != goalTemp.studentType) {
            goalTemp.isFirstLine = true;
            goalTemp.historyRecords = [];
            tempList.push(goalTemp);
            lastUniversity = goalTemp.universityName;
            lastType = goalTemp.studentType;
            continue;
        }
        tempList[tempList.length - 1].historyRecords.push(goalTemp);
    }
    if (tempList.length == 0) {
        isShowEmptyResult = true;
    }
    var matchedUniversityGoalSize = tempList.length - matchedMajorGoalSize;

    // calculate possibility and re-order
    // NOTE: this is the very simple method, just compare the latest min score with input score
    // target score:
    // 1. = min score (if min score not null)
    // 2. = average score x 2 = max score (if max, average score not null)
    // 3. = max score (if max score not null); = average score (if average score not null)
    var inputScore = req.session.usersetting.inputScore;
    for (i = 0; i < tempList.length; i++) {
        goalTemp = tempList[i];
        goalTemp.tmpScore = goalTemp.minScore;
        if (goalTemp.tmpScore == '--') {
            if (goalTemp.maxScore == '--') {
                goalTemp.tmpScore = goalTemp.averageScore;
            } else if (goalTemp.averageScore == '--') {
                goalTemp.tmpScore = goalTemp.maxScore;
            } else {
                goalTemp.tmpScore = goalTemp.averageScore * 2 - goalTemp.maxScore;
            }
        }
        // set possibility, 4 level: 1）冲刺 2）稳妥 3）保底 4）高风险
        var majorScoreLevel = [30, 10, -10];
        var univeristyScoreLevel = [40, 20, -5];
        goalTemp.diff = inputScore - goalTemp.tmpScore;
        if (goalTemp.isMajorGoal) {
            if (goalTemp.diff > majorScoreLevel[0]) {
                goalTemp.isSafe = true; // 保底
            } else if (goalTemp.diff > majorScoreLevel[1]) {
                goalTemp.isSteady = true; // 稳妥
            } else if (goalTemp.diff > majorScoreLevel[2]) {
                goalTemp.isRisky = true; // 冲刺
            } else {
                goalTemp.isOut = true; // 高风险
            }
        } else {
            if (goalTemp.diff > univeristyScoreLevel[0]) {
                goalTemp.isSafe = true; // 保底
            } else if (goalTemp.diff > univeristyScoreLevel[1]) {
                goalTemp.isSteady = true; // 稳妥
            } else if (goalTemp.diff > univeristyScoreLevel[2]) {
                goalTemp.isRisky = true; // 冲刺
            } else {
                goalTemp.isOut = true; // 高风险
            }
        }
    }
    tempList.sort(function (m, n) {
        return n.diff - m.diff;
    });

    var sortedGoalList = [];
    for (i = 0; i < tempList.length; i++) {
        goalTemp = tempList[i];
        temp = {};
        temp.isMajorGoal = goalTemp.isMajorGoal;
        temp.universityName = goalTemp.universityName;
        temp.majorName = goalTemp.majorName;
        temp.year = goalTemp.year;
        temp.studentType = goalTemp.studentType;
        temp.batch = goalTemp.batch;
        temp.maxScore = goalTemp.maxScore;
        temp.minScore = goalTemp.minScore;
        temp.averageScore = goalTemp.averageScore;
        temp.admissionsNumber = goalTemp.admissionsNumber;
        temp.provinceLine = goalTemp.provinceLine;
        temp.isFirstLine = goalTemp.isFirstLine;
        temp.isSafe = goalTemp.isSafe;
        temp.isSteady = goalTemp.isSteady;
        temp.isRisky = goalTemp.isRisky;
        temp.isOut = goalTemp.isOut;
        sortedGoalList.push(temp);
        if (goalTemp.historyRecords && goalTemp.historyRecords.length > 0) {
            for (j = 0; j < goalTemp.historyRecords.length; j++) {
                sortedGoalList.push(goalTemp.historyRecords[j]);
            }
        }
    }

    res.render('doMatch', {
        isShowEmpty: isShowEmptyResult,
        location: studentLocs,
        type: types,
        invalidScore: false,
        goalList: sortedGoalList,
        universityGoalSize: universityGoalSize,
        majorGoalSize: majorGoalSize,
        matchedUniversityGoalSize: matchedUniversityGoalSize,
        matchedMajorGoalSize: matchedMajorGoalSize,
    });
};

exports.trend = function (req, res) {
    var i;
    var temp;
    var predictList1 = [];
    var predictList2 = [];
    var predictList3 = [];
    var locations = data.getLocations();
    var predictMap = data.getPredictLocationLine();
    var length = 11;
    for (i = 0; i < length; i++) {
        temp = {};
        temp.name = locations[i].name;
        temp.score1 = predictMap.get(temp.name + '_文科');
        temp.score2 = predictMap.get(temp.name + '_理科');
        temp.score3 = predictMap.get(temp.name + '_综合');
        if (!temp.score1) {
            temp.score1 = '--';
        }
        if (!temp.score2) {
            temp.score2 = '--';
        }
        if (!temp.score3) {
            temp.score3 = '--';
        }
        predictList1.push(temp);
    }
    length = 22;
    for (i = 11; i < length; i++) {
        temp = {};
        temp.name = locations[i].name;
        temp.score1 = predictMap.get(temp.name + '_文科');
        temp.score2 = predictMap.get(temp.name + '_理科');
        temp.score3 = predictMap.get(temp.name + '_综合');
        if (!temp.score1) {
            temp.score1 = '--';
        }
        if (!temp.score2) {
            temp.score2 = '--';
        }
        if (!temp.score3) {
            temp.score3 = '--';
        }
        predictList2.push(temp);
    }
    length = locations.length;
    for (i = 22; i < length; i++) {
        temp = {};
        temp.name = locations[i].name;
        temp.score1 = predictMap.get(temp.name + '_文科');
        temp.score2 = predictMap.get(temp.name + '_理科');
        temp.score3 = predictMap.get(temp.name + '_综合');
        if (!temp.score1) {
            temp.score1 = '--';
        }
        if (!temp.score2) {
            temp.score2 = '--';
        }
        if (!temp.score3) {
            temp.score3 = '--';
        }
        predictList3.push(temp);
    }

    res.render('trend', {
        table1: predictList1,
        table2: predictList2,
        table3: predictList3
    });
};

exports.trendLocationLine = function (req, res) {
    var i = 0;
    var temp;
    var locations = data.getLocations();
    var locationArray = '';
    for (i = 0; i < locations.length; i++) {
        locationArray += '\'' + locations[i].name + '\'';
        if (i < locations.length - 1) {
            locationArray += ',';
        }
    }
    var x_years = '';
    for (i = 2005; i < 2019; i++) {
        x_years += '\'' + i + '\'';
        if (i < 2019) {
            x_years += ',';
        }
    }

    var locationLine = data.getLocationScore();
    var typeArt = [];
    var typeEngineer = [];
    var typeMix = [];
    for (i = 0; i < locationLine.length; i++) {
        temp = {};
        temp.score = locationLine[i].score;
        temp.type = locationLine[i].type;
        temp.x = locationLine[i].year - 2005;
        temp.y = locationLine[i].location_order - 1;
        if (temp.type == '文科') {
            typeArt.push(temp);
        } else if (temp.type == '理科') {
            typeEngineer.push(temp);
        } else if (temp.type == '综合') {
            if (temp.y == 1) {
                temp.y = 0;
            } else if (temp.y == 5) {
                temp.y = 1;
            } else if (temp.y == 16) {
                temp.y = 2;
            } else if (temp.y == 18) {
                temp.y = 3;
            } else if (temp.y == 30) {
                temp.y = 4;
            }
            typeMix.push(temp);
        }
    }

    var y_mix = "'上海','广东','江苏','辽宁','浙江'";

    res.render('trendLocationLine', {
        y_axes: locationArray,
        x_axes: x_years,
        scoreDataArt: typeArt,
        scoreDataEngineer: typeEngineer,
        scoreDataMix: typeMix,
        y_mix: y_mix
    });
};

exports.trendLocationLinePredict = function (req, res) {
    var length = 0;
    var i = 0;
    var temp;
    var locationName = '';

    var scoreLocations = [];
    var locations = data.getLocations();
    if (locations) {
        length = locations.length;
    }
    if (!req.query.location) {
        if (!req.session.usersetting) {
            req.session.usersetting = createSessionSetting();
        }
        req.query.location = req.session.usersetting.sl;
    }
    for (i = 0; i < length; i++) {
        var location = locations[i];
        temp = {};
        temp.name = location.name;
        temp.code = location.code;
        if (temp.code == req.query.location) {
            locationName = location.name;
            temp.selected = ' selected';
        } else {
            temp.selected = '';
        }
        scoreLocations.push(temp);
    }

    var allScoreLine = [];
    var predictScoreLine = [];
    var locationLine = data.getLocationScore();
    var types = [];
    var name;
    var maxScore = 600;
    var artScoreLines = [];
    var engineerScoreLines = [];
    for (i = 0; i < locationLine.length; i++) {
        temp = {};
        temp.score = locationLine[i].score;
        temp.year = locationLine[i].year;
        if (locationLine[i].code != req.query.location) {
            temp.type = locationLine[i].code + locationLine[i].type;
            if (locationLine[i].type === '理科') {
                engineerScoreLines.push(temp);
            } else if (locationLine[i].type === '文科') {
                artScoreLines.push(temp);
            }
            continue;
        }
        temp.type = locationLine[i].type;
        allScoreLine.push(temp);

        if (!name) {
            name = locationLine[i].name;
        }
        if (temp.score > maxScore) {
            maxScore = maxScore + 50;
        }

        temp = {};
        if (locationLine[i].year == '2018') {
            temp.score = locationLine[i].score;
            types.push(locationLine[i].type);
        } else {
            temp.score = 'null';
        }
        temp.year = locationLine[i].year;
        temp.type = locationLine[i].type;
        predictScoreLine.push(temp);
    }
    for (i = 0; i < allScoreLine.length; i++) {
        if (allScoreLine[i].type === '文科') {
            artScoreLines.push(allScoreLine[i]);
        } else if (allScoreLine[i].type === '理科') {
            engineerScoreLines.push(allScoreLine[i]);
        }
    }

    var predictMap = data.getPredictLocationLine();
    for (i = 0; i < types.length; i++) {
        var key = name + '_' + types[i];
        var score = predictMap.get(key);
        if (!score) {
            continue;
        }
        temp = {};
        temp.score = score;
        temp.year = '2019';
        temp.type = types[i];
        allScoreLine.push(temp);
        predictScoreLine.push(temp);
    }

    var predictList1 = [];
    var predictList2 = [];
    var predictList3 = [];
    length = 11;
    for (i = 0; i < length; i++) {
        temp = {};
        temp.name = locations[i].name;
        temp.score1 = predictMap.get(temp.name + '_文科');
        temp.score2 = predictMap.get(temp.name + '_理科');
        temp.score3 = predictMap.get(temp.name + '_综合');
        if (!temp.score1) {
            temp.score1 = '--';
        }
        if (!temp.score2) {
            temp.score2 = '--';
        }
        if (!temp.score3) {
            temp.score3 = '--';
        }
        predictList1.push(temp);
    }
    length = 22;
    for (i = 11; i < length; i++) {
        temp = {};
        temp.name = locations[i].name;
        temp.score1 = predictMap.get(temp.name + '_文科');
        temp.score2 = predictMap.get(temp.name + '_理科');
        temp.score3 = predictMap.get(temp.name + '_综合');
        if (!temp.score1) {
            temp.score1 = '--';
        }
        if (!temp.score2) {
            temp.score2 = '--';
        }
        if (!temp.score3) {
            temp.score3 = '--';
        }
        predictList2.push(temp);
    }
    length = locations.length;
    for (i = 22; i < length; i++) {
        temp = {};
        temp.name = locations[i].name;
        temp.score1 = predictMap.get(temp.name + '_文科');
        temp.score2 = predictMap.get(temp.name + '_理科');
        temp.score3 = predictMap.get(temp.name + '_综合');
        if (!temp.score1) {
            temp.score1 = '--';
        }
        if (!temp.score2) {
            temp.score2 = '--';
        }
        if (!temp.score3) {
            temp.score3 = '--';
        }
        predictList3.push(temp);
    }

    res.render('trendLocationLinePredict', {
        location: scoreLocations,
        all: allScoreLine,
        predict: predictScoreLine,
        maxScore: maxScore,
        table1: predictList1,
        table2: predictList2,
        table3: predictList3,
        artScoreLines: artScoreLines,
        engineerScoreLines: engineerScoreLines,
        locationName: locationName
    });
};