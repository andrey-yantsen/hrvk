window.onload = function() {
    $(document).on('click', '#keyword-list span.glyphicon-remove', function() {
        $(this).parent().remove();
    });

    $(document).on('click', '#keyword-list span.glyphicon-plus', function() {
        var $li = $(this).parent();
        var $clone = $li.clone();
        $('input', $clone).val('');
        $clone.insertAfter($li);
    });

    $('#refresh_groups').click(function() {
        var $ul = $('#groups');
        var addedGroups = [];
        $ul.html('');
        var delay = 0;

        $('#keyword-list input').each(function() {
            var value = this.value;
            if (value) {
                setTimeout(function() {
                    VK.api('groups.search', {q: value, type: 'group', count: 15}, function(data) {
                        var items = data.response.items;

                        for (var key in items) {
                            if (items.hasOwnProperty(key)) {
                                var group = items[key];
                                var group_id = group.id.toString();

                                if (addedGroups.indexOf(group_id) != -1) {
                                    continue;
                                } else {
                                    addedGroups.push(group_id);
                                }

                                var html = '<li><input type="checkbox" name="group[]" value="' + group_id + '" checked/> ' +
                                    '<a href="https://vk.com/public' + group_id + '" target="_blank">' + group.name + '</a></li>';
                                $ul.append(html);
                            }
                        }
                    });
                }, delay);
                delay += 350;
            }
        });
        return false;
    });

    var tt = null;
    var users = {};

    $('#begin').click(function() {
        var age_from = document.getElementById('age_from').value;
        var age_to = document.getElementById('age_to').value;
        var delay = 0;
        $('input[name="group[]"]:checked').each(function () {
            var group_id = this.value;
            $('#cities_select :selected').each(function() {
                var city_id = this.value;

                setTimeout(function() {
                    VK.api('users.search', {
                        city: city_id,
                        sex: 2,
                        age_from: age_from,
                        age_to: age_to,
                        group_id: group_id,
                        count: 1000
                    }, function(data) {
                        var items = data.response.items;
                        for (var key in items) {
                            if (items.hasOwnProperty(key)) {
                                var user = items[key];
                                if (users.hasOwnProperty(user.id)) {
                                    users[user.id].groups.push(group_id);
                                } else {
                                    user.groups = [group_id];
                                    users[user.id] = user;
                                }
                            }
                        }
                        if (items.length > 0) {
                            if (tt) {
                                clearTimeout(tt);
                            }
                            tt = setTimeout(display, 700);
                        }
                    });
                }, delay);
                delay += 350;
            });
        });
        return false;
    });

    function display() {
        var $ul = $('#response');
        $ul.html('');

        var sortable = [];
        for (var user_id in users) {
            sortable.push([users[user_id], users[user_id].groups.length]);
        }

        sortable.sort(function(a, b) {
            return b[1] - a[1];
        });

        var html = '';

        for (var idx in sortable) {
            var user = sortable[idx][0];
            var cnt = sortable[idx][1];
            if (cnt > 1) {
                var name = user.last_name + ' ' + user.first_name;
                html += '<li><a href="https://vk.com/id' + user.id.toString() + '">' + name + '</a> (' + cnt.toString() + ')</li>';
            }
        }

        $ul.html(html);

        return null;
    }

    VK.init(function() {
        window.success = true;

        VK.api('database.getCities', {country_id: 1, count: 1000}, function(data) {
            var items = data.response.items;
            var select = document.getElementById('cities_select');

            for (var key in items) {
                if (items.hasOwnProperty(key)) {
                    var city = items[key];
                    var opt = document.createElement('option');
                    opt.value = city.id;
                    opt.innerHTML = city.title;
                    select.appendChild(opt);
                }
            }
        });
    }, function() {
        alert('Something failed, sorry');
    }, '5.62');
};
