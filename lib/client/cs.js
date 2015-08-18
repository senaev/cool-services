var Cs = function() {
};

//����� ������ ������-������
Cs.prototype.call = function(method, params) {
    var deferred = $.Deferred();
    //��������� �����-�� ��������� ����� �� �����, ����� �� ���� ������� � ����������
    if (method && typeof method === 'string' && /^[\w\d]{1,}\.[\w\d]{1,}$/.test(method)) {
        $.ajax({
            method: "POST",
            url: "/request/bl",
            data: {
                'method': method,
                'params': JSON.stringify(params),
                'socketId': (function() {
                    if (window.socket && typeof window.socket.id === 'string') {
                        return window.socket.id;
                    } else {
                        return null;
                    }
                })()
            },
            success: function(a) {
                if (a.status && a.status === 'ok') {
                    deferred.resolve(a.data);
                } else if (a.status === 'error' && a.info) {
                    deferred.reject(a.info);
                } else {
                    deferred.reject({
                        code: 0,
                        message: '��������� ������ � ���� ���������� ������ ������-������ �� �������',
                        details: {
                            message: '� ������� ������ �����, �� ��������������� ���������� ������� ������-������',
                            method: method,
                            data: params,
                            answer: a
                        }
                    });
                }
            },
            error: function(err, textStatus, errorName) {
                deferred.reject({
                    code: 0,
                    message: '��������� ������ � ���� ���������� ������� � ������ ������-������',
                    details: {
                        message: '��������� AJAX-error � ���� ���������� ������� � ������ ������-������ �� �������',
                        method: method,
                        data: params,
                        error: err,
                        textStatus: textStatus,
                        errorName: errorName
                    }
                });
            }
        });
    } else {
        deferred.reject({
            code: 0,
            message: '�������� ������ ������-������ ������� � �������� �������',
            details: {
                message: '���� �� �� �������� � ������� �������� ������ ������ ������, ���� ��� �� �������� �������, ' +
                '���� �������� � �������� �������.�������� ������ ������ ������ ������ �������� �� ��������� ��������, ���� � �����. ' +
                '��� ���� ����� ������ ���� ���� � ������ ��������� ��� ����� - ��� ������ ������-������ � ��� ������. ' +
                '��� ����� ������ �������� �� ������� ������ ���������� �������, ��� �����',
                method: method
            }
        });
    }
    return deferred.promise();
};

var bl = new Cs();
