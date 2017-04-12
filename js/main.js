window.onload = function () {
    $("#age-range").slider({
        tooltip: 'always',
        selection: 'after',
        tooltip_split: true
    });

    var countriesMap = {};

    var countries = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.whitespace,
        queryTokenizer: Bloodhound.tokenizers.whitespace
    });

    var $country = $('#country');
    $country.typeahead({
            hint: true,
            highlight: true,
            minLength: 1
        },
        {
            name: 'countries',
            source: countries
        });

    VK.init(function () {
        VK.api('database.getCountries', {
            need_all: 1,
            count: 1000
        }, function (data) {
            for (v in data.response.items) {
                countriesMap[data.response.items[v].title] = data.response.items[v].id;
                countries.add(data.response.items[v].title);
            }
        });
    }, function () {
        alert('Something failed, sorry');
    }, '5.62');

    var $refreshGroupsGI = $('#refresh-groups');

    var refreshBtnAddClassGen = function (className) {
        return function (event) {
            $refreshGroupsGI.addClass(className);
        };
    };

    $('#keyword-list').on('itemAdded', refreshBtnAddClassGen('pending'))
        .on('itemRemoved', refreshBtnAddClassGen('pending'));

    $refreshGroupsGI.on('click', function() {
            $refreshGroupsGI.addClass('spin');
            var $ul = $('#groups-list');
            var addedGroups = [];
            var delay = 0;
            $ul.html('');

            var code = [];

            $.each($("#keyword-list").tagsinput('items'), function(idx, value) {
                code.push('API.groups.search(' + JSON.stringify({q: value, count: 10}) + ')');
            });

            if (code.length === 0) {
                $refreshGroupsGI.removeClass('spin pending');
                return false;
            }

            VK.api('execute', {'code': 'return [' + code.join(',') + '];'}, function (data) {
                for (var idx in data.response) {
                    var items = data.response[idx].items;
                    for (var key in items) {
                        if (items.hasOwnProperty(key)) {
                            var group = items[key];
                            var groupId = group.id.toString();

                            if (addedGroups.indexOf(groupId) !== -1) {
                                continue;
                            } else {
                                addedGroups.push(groupId);
                            }

                            var html = '<li><input type="checkbox" name="group[]" value="' + groupId + '" checked/> ' +
                                '<a href="https://vk.com/public' + groupId + '" target="_blank">' + group.name + '</a></li>';
                            $ul.append(html);
                        }
                    }
                }
                VK.callMethod('resizeWindow', null, $(document).height());
                $refreshGroupsGI.removeClass('spin pending');
            });

            return false;
        });

    var cities = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('text'),
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        remote: {
            url: '%QUERY%',
            wildcard: '%QUERY%',
            transport: function (query, onSuccess, onError) {
                var term = decodeURIComponent(query.url);
                var countryName = $('#country').val();
                if (!countriesMap.hasOwnProperty(countryName)) {
                    alert('Unknown country, sorry :(');
                    return false;
                }
                var countryId = countriesMap[countryName];
                VK.api('database.getCities', {country_id: countryId, q: term, need_all: 1, count: 50}, function(data) {
                    onSuccess(data.response.items);
                });
            }
        }
    });

    var $elt = $('#cities-list');
    $elt.tagsinput({
        itemValue: 'id',
        itemText: 'title',
        typeaheadjs: {
            name: 'cities',
            displayKey: 'title',
            source: cities.ttAdapter()
        }
    });

    var school = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('text'),
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        remote: {
            url: '%QUERY%',
            wildcard: '%QUERY%',
            transport: function (query, onSuccess, onError) {
                var term = decodeURIComponent(query.url);
                var code = [];
                var cities = {};

                $.each($('#cities-list').tagsinput('items'), function(key, value) {
                    cities[key] = value.title;
                    var options = {city_id: value.id, q: term};
                    code.push('API.database.getSchools(' + JSON.stringify(options) + ')');
                });

                VK.api('execute', {code: 'return [' + code.join(',') + '];'}, function(data) {
                    var schools = [];
                    for (var idx in data.response) {
                        var items = data.response[idx].items;
                        for (var key in items) {
                            if (items.hasOwnProperty(key)) {
                                var item = items[key];
                                schools.push({id: item.id, title: item.title + ', ' + cities[idx]});
                            }
                        }
                    }
                    onSuccess(schools);
                });
            }
        }
    });

    var $elt = $('#schools-list');
    $elt.tagsinput({
        itemValue: 'id',
        itemText: 'title',
        typeaheadjs: {
            name: 'school',
            displayKey: 'title',
            source: school.ttAdapter()
        }
    });

    var university = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('text'),
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        remote: {
            url: '%QUERY%',
            wildcard: '%QUERY%',
            transport: function (query, onSuccess, onError) {
                var term = decodeURIComponent(query.url);
                var code = [];
                var cities = {};

                $.each($('#cities-list').tagsinput('items'), function(key, value) {
                    cities[key] = value.title;
                    var options = {city_id: value.id, q: term};
                    code.push('API.database.getUniversities(' + JSON.stringify(options) + ')');
                });

                VK.api('execute', {code: 'return [' + code.join(',') + '];'}, function(data) {
                    var universities = [];
                    for (var idx in data.response) {
                        var items = data.response[idx].items;
                        for (var key in items) {
                            if (items.hasOwnProperty(key)) {
                                var item = items[key];
                                universities.push({id: item.id, title: item.title + ', ' + cities[idx]});
                            }
                        }
                    }
                    onSuccess(universities);
                });
            }
        }
    });

    var $elt = $('#university-list');
    $elt.tagsinput({
        itemValue: 'id',
        itemText: 'title',
        typeaheadjs: {
            name: 'university',
            displayKey: 'title',
            source: university.ttAdapter()
        }
    });

    var faculty = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('title'),
        queryTokenizer: Bloodhound.tokenizers.whitespace
    });

    var refreshFaculties = function() {
        faculty.clear();
        var code = [];
        var universities = {};

        $.each($('#university-list').tagsinput('items'), function(key, value) {
            universities[key] = value.title;
            var options = {university_id: value.id};
            code.push('API.database.getFaculties(' + JSON.stringify(options) + ')');
        });

        VK.api('execute', {code: 'return [' + code.join(',') + '];'}, function(data) {
            for (var idx in data.response) {
                var items = data.response[idx].items;
                for (var key in items) {
                    if (items.hasOwnProperty(key)) {
                        var item = items[key];
                        faculty.add({id: item.id, title: item.title + ', ' + universities[idx]});
                    }
                }
            }
        });
    };
    $elt.on('itemAdded', refreshFaculties).on('itemRemoved', refreshFaculties);

    var $elt = $('#faculty-list');
    $elt.tagsinput({
        itemValue: 'id',
        itemText: 'title',
        typeaheadjs: {
            name: 'faculty',
            displayKey: 'title',
            source: faculty.ttAdapter()
        }
    });

    $('#search-btn').click(function() {
        var $icon = $('span.glyphicon', this);
        $icon.removeClass('glyphicon-search').addClass('glyphicon-refresh spin');
        var code = [];
        var $ul = $('#users-list');
        $ul.html('');

        var ages = $("#age-range").slider('getValue');

        var requests = [{
            sex: $('input[name=sex]:checked').val(),
            age_from: ages[0],
            age_to: ages[1],
            count: 1000
        }];

        var groups = {};
        var ret = [];
        $('input[name="group[]"]:checked').each(function () {
            var groupId = parseInt(this.value);
            groups[groupId] = $(this).next().text();
            for (var r in requests) {
                var req = JSON.parse(JSON.stringify(requests[r]));
                req['group_id'] = groupId;
                ret.push(req);
            }
        });
        requests = ret.length ? ret : requests;
        ret = [];
        $.each($('#cities-list').tagsinput('items'), function(key, value) {
            for (var r in requests) {
                var req = requests[r];
                req['city'] = value.id;
                ret.push(req);
            }
        });
        requests = ret.length ? ret : requests;
        ret = [];
        $.each($('#schools-list').tagsinput('items'), function(key, value) {
            for (var r in requests) {
                var req = requests[r];
                req['school'] = value.id;
                ret.push(req);
            }
        });
        requests = ret.length ? ret : requests;
        ret = [];
        $.each($('#university-list').tagsinput('items'), function(key, value) {
            for (var r in requests) {
                var req = requests[r];
                req['university'] = value.id;
                ret.push(req);
            }
        });
        requests = ret.length ? ret : requests;
        ret = [];
        $.each($('#faculty-list').tagsinput('items'), function(key, value) {
            for (var r in requests) {
                var req = requests[r];
                req['university_faculty'] = value.id;
                ret.push(req);
            }
        });
        requests = ret.length ? ret : requests;
        console.log(requests);

        code = [];
        for (var r in requests) {
            code.push('API.users.search(' + JSON.stringify(requests[r]) + ')');
        }
        var users = {};
        VK.api('execute', {code: 'return [' + code.join(',') + '];'}, function (data) {
            for (var r in data.response) {
                var searchRequest = requests[r];
                var items = data.response[r].items;
                for (var key in items) {
                    if (items.hasOwnProperty(key)) {
                        var user = items[key];
                        if (!users.hasOwnProperty(user.id)) {
                            user.occurencies = 0;
                            user.groups = [];
                            users[user.id] = user;
                        }
                        users[user.id].occurencies++;

                        if (searchRequest.hasOwnProperty('group_id')) {
                            users[user.id].groups.push({
                                id: searchRequest.group_id,
                                title: groups[searchRequest.group_id]
                            });
                        }
                    }
                }
            }

            var sortable = [];
            for (var userId in users) {
                sortable.push([users[userId], users[userId].occurencies]);
            }

            sortable.sort(function (a, b) {
                return b[1] - a[1];
            });

            var html = '';

            for (var idx in sortable) {
                var u = sortable[idx][0];
                var cnt = sortable[idx][1];
                var name = u.last_name + ' ' + u.first_name;
                var userGroups = [];

                for (gid in u.groups) {
                    if (u.groups.hasOwnProperty(gid)) {
                        var group = u.groups[gid];
                        userGroups.push('<a href="https://vk.com/public' + group.id.toString() + '">' + group.title + '</a>');
                    }
                }

                var appendix = cnt.toString();
                if (userGroups.length) {
                    appendix = userGroups.join(', ')
                }

                html += '<li><a href="https://vk.com/id' + u.id.toString() + '">' + name + '</a> (' + appendix + ')</li>';
            }

            $ul.html(html);
            VK.callMethod('resizeWindow', null, $(document).height());
            $icon.removeClass('glyphicon-refresh spin').addClass('glyphicon-search');
        });
        return false;
    });
};
