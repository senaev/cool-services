module.exports = {
    //�������, ����������� �� �������� ������� ������-������
    //� ����� ������ ���� ��������� ������� done(result, error)
    //� ������ ����������� ���������� � ������� ��� ������ ����� � �������
    //� ������ ������-������ �������� �� �����
    //���������� � ��������� ������ ������-������
    init: function(done) {
        //console.log('��������� ������� beforeInit ������ Test');
        setTimeout(function() {
            done(true);
        }, 1000);
    },
    //�������, ����������� ����� ���������� ������� � ������-������
    //����� ��� �� ����� ������� - �������... �������� ������ ����������� ��������� �����-�� ��������
    init: function() {
        //console.log('��������� ������� init ������ Test');
    },
    /**
     * ������ ������ ������: �������� ��� �������� ����������:
     * 1) ������ ���������: �����
     * 2) ���������: {
    *        //�������� �� ����� ��������� - ����� �� ���� �������� ������� ��� ������ ����� post-������... �� ��������� - false
    *        isPublic: true,
    *        //�������� �� ����� ������ API - ���� �� � ���� ������ �� ������ ������� ������-������... �� ��������� - false
    *        //!!!��� ��������� ������ �� ��������� �������� ������ API
    *        isApi: true,
    *        //��� ����� ������-������, � ������� ���������� ��������� � ������� done()
    *        method: function(params, done) {
    *            var result = '��������� ���������� ������ ������-������';
    *            done(result);
    *        }
    *    }
     */
    methods: {
        'ReturnParams': {
            isPublic: true,
            method: function(params, done) {
                done([5, 4, 3, 2, 1, 'params: ', params]);
            }
        },
        'Passage': {
            isPublic: true,
            method: function(params, done) {
                var self = this,
                    done1 = false,
                    done2 = false;

                params['Passage'] = 'Passage!!!';
                this.call('Test.Passage1', params, function(result, error) {
                    done1 = true;
                    params['Passage1'] = error;
                    checkDone();
                });
                this.call('Test.Passage2', null, function(result, error) {
                    for (var key in result) {
                        params[key] = result[key];
                    }
                    done2 = true;
                    checkDone();
                });
                function checkDone() {
                    if (done1 && done2) {
                        done(params);
                    }
                }
            }
        },
        'Passage1': function(params, done) {
            done(null, 'eeeeroroororororor');
        },
        'Passage2': function(params, done) {
            this.call('Test.Passage3', null, function(result, error) {
                done({
                    'Passage3': result,
                    'Passage2': 'Passage2!!!'
                });
            });
        },
        'Passage3': function(params, done) {
            var self = this;
            setTimeout(function() {
                done(self.getSocketId());
            }, 1234);
        }
    }
};