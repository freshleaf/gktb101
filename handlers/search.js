const data = require('../lib/data.js');

// FIXME: duplicated with main.js
var createSessionSetting = function () {
    var setting = {};
    setting.sl = 11; // first item: 北京
    setting.type = 0;
    setting.inputScore = 600;
    return setting;
};

exports.handleSearch = function (req, res) {
    if (req.query.type == 0) {
        res.redirect('/search/location?key=' + req.query.key);
    } else if (!req.query.type || req.query.type == 1) {
        res.redirect('/search/university?key=' + req.query.key);
    } else if (req.query.type == 2) {
        res.redirect('/search/major?key=' + req.query.key);
    }
};

exports.searchLocationScore = function (req, res) {
    var searchContent = req.query.key;
    if (searchContent) {
        searchContent = searchContent.trim();
    }

    var locations = data.getLocations();
    var studentLocs = [];
    var isFound = false;
    var temp;
    for (var i = 0; i < locations.length; i++) {
        var location = locations[i];
        temp = {};
        temp.name = location.name;
        if (temp.name == searchContent) {
            temp.selected = ' selected';
            isFound = true;
        } else {
            temp.selected = '';
        }
        studentLocs.push(temp);
    }

    var searchResult = [];
    var searchKey = '北京';
    if (isFound) {
        searchKey = searchContent;
    }
    var scoreList = data.getLocationScoreByName(searchKey);
    var tempYear = 0;
    for (var i = 0; i < scoreList.length; i++) {
        if (tempYear != scoreList[i].year) {
            temp = {};
            tempYear = scoreList[i].year;
            temp.year = scoreList[i].year;
            temp.location = searchKey;
            searchResult.push(temp);
        }
        if (scoreList[i].type == '文科') {
            temp.artScore = scoreList[i].score;
        } else if (scoreList[i].type == '理科') {
            temp.enginScore = scoreList[i].score;
        } else if (scoreList[i].type == '综合') {
            temp.mixScore = scoreList[i].score;
        }
    }
    for (var i = 0; i < searchResult.length; i++) {
        temp = scoreList[i];
        if (!searchResult[i].artScore) {
            searchResult[i].artScore = '--';
        }
        if (!searchResult[i].enginScore) {
            searchResult[i].enginScore = '--';
        }
        if (!searchResult[i].mixScore) {
            searchResult[i].mixScore = '--';
        }
    }

    res.render('searchLocationScore', {
        searchKey: searchContent,
        location: studentLocs,
        searchResult: searchResult
    });
};

exports.searchUniversityScore = function (req, res) {
    var searchContent = req.query.key;
    if (searchContent) {
        searchContent = searchContent.trim();
    }
    var code = req.query.code;

    var allList = [];
    var someList = [];
    var resultList = [];
    var universityInfo;
    var studengLocName;

    if (code) {
        // search by code
        var findUniversity = data.getUnversityByCode(code);
        if (findUniversity.length == 0) {
            var allUniversities = data.getAllUniversitiesWithLocation();
            var tempLocName = '';
            var tempLocUni;
            for (var i = 0; i < allUniversities.length; i++) {
                var item = allUniversities[i];
                if (tempLocName != item.location_name) {
                    tempLocName = item.location_name;
                    tempLocUni = {};
                    tempLocUni.locName = tempLocName;
                    tempLocUni.uniList = [];
                    allList.push(tempLocUni);
                }
                var temp = {};
                temp.name = item.name;
                temp.url = '/search/university?code=' + item.code;
                tempLocUni.uniList.push(temp);
            }
        } else {
            // hit
            universityInfo = {};
            universityInfo.name = findUniversity[0].name;
            universityInfo.code = findUniversity[0].code;
            universityInfo.loc = findUniversity[0].location_name;
            if (universityInfo.name != findUniversity[0].alias) {
                universityInfo.alias = findUniversity[0].alias;
            }
            universityInfo.is_985 = findUniversity[0].is_985;
            universityInfo.is_211 = findUniversity[0].is_211;
        }
    } else {
        // search by name
        var findUniversities = [];
        if (searchContent) {
            findUniversities = data.getUniversitiesByName(searchContent);
        }

        if (findUniversities.length == 0) {
            var allUniversities = data.getAllUniversitiesWithLocation();
            var tempLocName = '';
            var tempLocUni;
            for (var i = 0; i < allUniversities.length; i++) {
                var item = allUniversities[i];
                if (tempLocName != item.location_name) {
                    tempLocName = item.location_name;
                    tempLocUni = {};
                    tempLocUni.locName = tempLocName;
                    tempLocUni.uniList = [];
                    allList.push(tempLocUni);
                }
                var temp = {};
                temp.name = item.name;
                temp.url = '/search/university?code=' + item.code;
                tempLocUni.uniList.push(temp);
            }
        } else if (findUniversities.length > 1) {
            // find several
            for (var i = 0; i < findUniversities.length; i++) {
                var item = findUniversities[i];
                var temp = {};
                temp.name = item.name;
                temp.url = '/search/university?code=' + item.code;
                someList.push(temp);
            }
        } else if (findUniversities.length == 1) {
            // hit
            universityInfo = {};
            universityInfo.name = findUniversities[0].name;
            universityInfo.code = findUniversities[0].code;
            universityInfo.loc = findUniversities[0].location_name;
            if (universityInfo.name != findUniversities[0].alias) {
                universityInfo.alias = findUniversities[0].alias;
            }
            universityInfo.is_985 = findUniversities[0].is_985;
            universityInfo.is_211 = findUniversities[0].is_211;
            code = universityInfo.code;
        }
    }

    if (universityInfo) {
        // SEO
        if (code) {
            var seoTitle = '高考填报101_' + universityInfo.name + '历年分数线';
            var seoKeywords = universityInfo.name + '历年分数线,';
            if (universityInfo.alias) {
                seoKeywords += universityInfo.alias + ',';
            }
            seoKeywords += '高考,高考志愿填报,高考高校分数线,211,985,重点大学分数线,学校分数线';
        }

        if (!req.session.usersetting) {
            req.session.usersetting = createSessionSetting();
        }
        if (req.query.loc) {
            req.session.usersetting.sl = req.query.loc;
        }
        var locationCode = req.query.loc;
        if (!locationCode) {
            locationCode = req.session.usersetting.sl;
        }

        var locations = data.getLocations();
        var studentLocs = [];
        var isFoundLoc = false;
        for (var i = 0; i < locations.length; i++) {
            var location = locations[i];
            var temp = {};
            temp.code = location.code;
            temp.name = location.name;
            if (temp.code == locationCode) {
                temp.selected = ' selected';
                studengLocName = location.name;
                isFoundLoc = true;
            } else {
                temp.selected = '';
            }
            studentLocs.push(temp);
        }
        var paramLoc = locationCode;
        if (!isFoundLoc) {
            paramLoc = studentLocs[0].code;
            studengLocName = studentLocs[0].name;
        }

        var scoreList = data.getUniversityScoreByCode(universityInfo.code, paramLoc);
        var tempYear = 0;
        var isShowMix = false;
        var year = req.query.year;
        if (!year && scoreList.length > 0) {
            year = scoreList[0].year;
        }
        var yearList = [];
        var tempYear = 0;
        for (var i = 0; i < scoreList.length; i++) {
            if (tempYear != scoreList[i].year) {
                temp = {};
                tempYear = scoreList[i].year;
                temp.year = scoreList[i].year;
                temp.loactionName = scoreList[i].location_name;
                resultList.push(temp);
                // get year range
                yearList.push({'year': tempYear});
            }
            if (scoreList[i].student_type == '文科') {
                temp.artMaxScore = scoreList[i].max_score;
                temp.artMinScore = scoreList[i].min_score;
                temp.artAveScore = scoreList[i].average_score;
                temp.artAdmissions = scoreList[i].admissions_number;
            } else if (scoreList[i].student_type == '理科') {
                temp.enginMaxScore = scoreList[i].max_score;
                temp.enginMinScore = scoreList[i].min_score;
                temp.enginAveScore = scoreList[i].average_score;
                temp.enginAdmissions = scoreList[i].admissions_number;
            } else if (scoreList[i].student_type == '综合') {
                isShowMix = true;
                temp.mixMaxScore = scoreList[i].max_score;
                temp.mixMinScore = scoreList[i].min_score;
                temp.mixAveScore = scoreList[i].average_score;
                temp.mixAdmissions = scoreList[i].admissions_number;
            }
        }
        for (var i = 0; i < resultList.length; i++) {
            temp = scoreList[i];
            if (!resultList[i].artMaxScore) {
                resultList[i].artMaxScore = '--';
            }
            if (!resultList[i].artMinScore) {
                resultList[i].artMinScore = '--';
            }
            if (!resultList[i].artAveScore) {
                resultList[i].artAveScore = '--';
            }
            if (!resultList[i].enginMaxScore) {
                resultList[i].enginMaxScore = '--';
            }
            if (!resultList[i].enginMinScore) {
                resultList[i].enginMinScore = '--';
            }
            if (!resultList[i].enginAveScore) {
                resultList[i].enginAveScore = '--';
            }
            if (!resultList[i].mixMaxScore) {
                resultList[i].mixMaxScore = '--';
            }
            if (!resultList[i].mixMinScore) {
                resultList[i].mixMinScore = '--';
            }
            if (!resultList[i].mixAveScore) {
                resultList[i].mixAveScore = '--';
            }
        }
        // get all major score for the university and year
        var majorScoreList = data.getUniversityMajorScore(universityInfo.code, paramLoc, year);
        var type = '';
        for (var i = 0; i < majorScoreList.length; i++) {
            if (type != majorScoreList[i].student_type) {
                type = majorScoreList[i].student_type;
                majorScoreList[i].firstLine = true;
            }
        }
    }

    res.render('searchUniversityScore', {
        searchKey: searchContent,
        location: studentLocs,
        studentLocName: studengLocName,
        code: code,
        allList: allList,
        someList: someList,
        someLength: someList.length,
        university: universityInfo,
        resultList: resultList,
        seoTitle: seoTitle,
        seoKeywords: seoKeywords,
        isShowMix: isShowMix,
        majorScoreList: majorScoreList,
        yearList: yearList,
        year: year,
    });
};

exports.searchMajorScore = function (req, res) {
    var searchContent = req.query.key;
    if (searchContent) {
        searchContent = searchContent.trim();
    }
    var code = req.query.code;

    var allList = [];
    var someList = [];
    var resultList = [];
    var similarList = [];
    var majorInfo;

    var isShowAll = false;

    if (code) {
        // search by code
        var findMajorByCode = data.getMajorByCode(code);
        if (findMajorByCode.length == 1) {
            majorInfo = {};
            majorInfo.code = findMajorByCode[0].code;
            majorInfo.name = findMajorByCode[0].name;
        } else {
            // not found
            isShowAll = true;
        }
    } else {
        if (searchContent) {
            // search by name, first check unique
            var majorList = data.getMajorsByName(searchContent);
            if (majorList.length > 1) {
                for (var i = 0; i < majorList.length; i++) {
                    var temp = {};
                    temp.url = '/search/major?code=' + majorList[i].code;
                    temp.name = majorList[i].name;
                    someList.push(temp);
                }
            } else if (majorList.length == 0) {
                // not found, list all
                isShowAll = true;
            } else { // length = 1
                majorInfo = {};
                majorInfo.code = majorList[0].code;
                majorInfo.name = majorList[0].name;
                code = majorInfo.code;
            }
        } else {
            // not search, list all
            isShowAll = true;
        }
    }

    if (isShowAll) {
        // 列出所有专业供查询
        var allMajors = data.getAllMajors();
        var mainClass = {};
        var subClass = {};
        var majorItem = {};
        for (var i = 0; i < allMajors.length; i++) {
            var item = allMajors[i];
            if (item.code.length == 2) {
                mainClass = {};
                mainClass.name = item.name;
                mainClass.subList = [];
                allList.push(mainClass);
            } else if (item.code.length == 4) {
                subClass = {};
                subClass.url = '/search/major?code=' + item.code;
                subClass.name = item.name;
                subClass.majorList = [];
                mainClass.subList.push(subClass);
            } else {
                majorItem = {};
                majorItem.url = '/search/major?code=' + item.code;
                majorItem.name = item.name;
                subClass.majorList.push(majorItem);
            }
        }
    }

    if (majorInfo) {
        // SEO
        if (code) {
            var seoTitle = '高考填报101_' + majorInfo.name + '专业历年分数线';
            var seoKeywords = majorInfo.name + '专业历年分数线,';
            seoKeywords += '高考,高考志愿填报,高考专业分数线,211,985,重点大学专业分数线,专业线';
        }

        // get same subclass major list
        var similarMajors = data.getSameSubClassMajors(majorInfo.code);
        for (var i = 0; i < similarMajors.length; i++) {
            if (similarMajors[i].code == majorInfo.code) {
                continue;
            }
            var temp = {};
            temp.url = '/search/major?code=' + similarMajors[i].code;
            temp.name = similarMajors[i].name;
            similarList.push(temp);
        }

        if (!req.session.usersetting) {
            req.session.usersetting = createSessionSetting();
        }
        if (req.query.loc) {
            req.session.usersetting.sl = req.query.loc;
        }
        var locationCode = req.query.loc;
        if (!locationCode) {
            locationCode = req.session.usersetting.sl;
        }

        var locations = data.getLocations();
        var studentLocs = [];
        var isFoundLoc = false;
        for (var i = 0; i < locations.length; i++) {
            var location = locations[i];
            var temp = {};
            temp.code = location.code;
            temp.name = location.name;
            if (temp.code == locationCode) {
                temp.selected = ' selected';
                isFoundLoc = true;
            } else {
                temp.selected = '';
            }
            studentLocs.push(temp);
        }
        var paramLoc = locationCode;
        if (!isFoundLoc) {
            paramLoc = studentLocs[0].code;
        }

        var scoreList = data.getAllMajorScore(majorInfo.code, paramLoc);
        var tempUniversity = '', tempType = '';
        for (var i = 0; i < scoreList.length; i++) {
            var item = scoreList[i];
            var temp = {};
            temp.locNmae = item.location_name;
            temp.university = item.university_name;
            temp.type = item.student_type;
            temp.year = item.year;
            temp.batch = item.batch;
            if (item.max_score) {
                temp.maxScore = item.max_score;
            } else {
                temp.maxScore = '--';
            }
            if (item.min_score) {
                temp.minScore = item.min_score;
            } else {
                temp.minScore = '--';
            }
            if (item.average_score) {
                temp.aveScore = item.average_score;
            } else {
                temp.aveScore = '--';
            }

            if (tempUniversity != temp.university) {
                tempUniversity = temp.university;
                temp.isFirstItem = true;
            }
            if (tempType != temp.type) {
                tempType = temp.type;
                temp.isFirstItem = true;
            }
            resultList.push(temp);
        }
    }

    res.render('searchMajoreScore', {
        searchKey: searchContent,
        location: studentLocs,
        code: code,
        allList: allList,
        someList: someList,
        someLength: someList.length,
        major: majorInfo,
        similarList: similarList,
        resultList: resultList,
        seoTitle: seoTitle,
        seoKeywords: seoKeywords,
    });
};