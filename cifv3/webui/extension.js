console.log('Loading cifv3 WebUI');

(function() {

function CIFv3SideConfigController($scope, MinemeldConfigService, MineMeldRunningConfigStatusService,
                                  toastr, $modal, ConfirmService, $timeout) {
    var vm = this;

    // side config settings
    vm.remote = undefined;
    vm.token = undefined;
    vm.verify_cert = undefined;


    vm.loadSideConfig = function() {
        var nodename = $scope.$parent.vm.nodename;

        MinemeldConfigService.getDataFile(nodename + '_side_config')
        .then((result) => {
            if (!result) {
                return;
            }

            if (result.remote) {
                vm.remote = result.remote;
            } else {
                vm.remote = undefined;
            }

            if (result.token) {
                vm.token = result.token;
            } else {
                vm.token = undefined;
            }

            if (typeof result.verify_cert !== 'undefined') {
                vm.verify_cert = result.verify_cert;
            } else {
                vm.verify_cert = undefined;
            }

        }, (error) => {
            toastr.error('ERROR RETRIEVING NODE SIDE CONFIG: ' + error.status);
            vm.remote = undefined;
            vm.token = undefined;
            vm.verify_cert = undefined;
        })
    };

    vm.saveSideConfig = function() {
        var side_config = {};
        var hup_node = undefined;
        var nodename = $scope.$parent.vm.nodename;

        if (vm.remote) {
            side_config.remote = vm.remote;
        }

        if (vm.token) {
            side_config.token = vm.token;
        }

        if (typeof vm.verify_cert !== 'undefined') {
            side_config.verify_cert = vm.verify_cert;
        }

	if (vm.filters) {
	    side_config.flattenedFilters = vm.filters;
	}

        return MinemeldConfigService.saveDataFile(
            nodename + '_side_config',
            side_config
        );
    };

    vm.setRemote = function() {
        var mi = $modal.open({
            templateUrl: '/extensions/webui/cifv3Webui/cifv3.miner.sremote.modal.html',
            controller: ['$modalInstance', CIFv3RemoteController],
            controllerAs: 'vm',
            bindToController: true,
            backdrop: 'static',
            animation: false,
            resolve: {
                remote: () => { return this.remote; }
            }
        });

        mi.result.then((result) => {
            vm.remote = result.remote;

            return vm.saveSideConfig().then(() => {
            	toastr.success('REMOTE SET');
            	vm.loadSideConfig();
            }, (error) => {
            	toastr.error('ERROR SETTING REMOTE: ' + error.statusText);
            });
    	});
    };

    vm.setToken = function() {
        var mi = $modal.open({
            templateUrl: '/extensions/webui/cifv3Webui/cifv3.miner.stoken.modal.html',
            controller: ['$modalInstance', CIFv3TokenController],
            controllerAs: 'vm',
            bindToController: true,
            backdrop: 'static',
            animation: false
        });

        mi.result.then((result) => {
            vm.token = result.token;

            return vm.saveSideConfig().then((result) => {
            	toastr.success('TOKEN SET');
            	vm.loadSideConfig();
            }, (error) => {
            	toastr.error('ERROR SETTING TOKEN: ' + error.statusText);
            });
    	});
    };

    vm.toggleVerifyCert = function() {
        var p, new_value;

        if (typeof this.verify_cert === 'undefined' || this.verify_cert) {
            new_value = false;
            p = ConfirmService.show(
                'CIF VERIFY SSL',
                'Are you sure you want to disable certificate verification ?'
            );
        } else {
            new_value = true;
            p = ConfirmService.show(
                'CIF VERIFY SSL',
                'Are you sure you want to enable certificate verification ?'
            );
        }

        p.then((result) => {
            vm.verify_cert = new_value;

            return vm.saveSideConfig().then((result) => {
                toastr.success('VERIFY SSL TOGGLED');
                vm.loadSideConfig();
            }, (error) => {
                toastr.error('ERROR TOGGLING VERIFY SSL: ' + error.statusText);
            });
        });
    };

    vm.setFilters = function() {
        var mi = $modal.open({
            templateUrl: '/extensions/webui/cifv3Webui/cifv3.miner.sfilters.modal.html',
            controller: ['$modalInstance', CIFv3FiltersController],
            controllerAs: 'vm',
            bindToController: true,
            backdrop: 'static',
            animation: false,
            resolve: {
                filters: () => { return vm.filters; }
            }
        });

        mi.result.then((result) => {
            vm.filters = result.filters;

            return vm.saveSideConfig().then((result) => {
            	toastr.success('FILTERS SET');
            	vm.loadSideConfig();
            }, (error) => {
            toastr.error('ERROR SETTING FILTERS: ' + error.statusText);
            });
    	});
    };

    vm.loadSideConfig();
}


function CIFv3RemoteController($modalInstance, remote) {
    var vm = this;

    vm.remote = remote;

    vm.valid = function() {
        angular.element('#remote').removeClass('has-error');

        if (!vm.remote) {
            return false;
        }

        return true;
    };

    vm.save = function() {
        var result = {};

        result.remote = vm.remote;

        $modalInstance.close(result);
    }

    vm.cancel = function() {
        $modalInstance.dismiss();
    }
}

function CIFv3TokenController($modalInstance, token) {
    var vm = this;

    vm.remote = token;

    vm.valid = function() {
        angular.element('#token').removeClass('has-error');

        if (!vm.token) {
            return false;
        }

        return true;
    };

    vm.save = function() {
        var result = {};

        result.token = vm.token;

        $modalInstance.close(result);
    }

    vm.cancel = function() {
        $modalInstance.dismiss();
    }
}

function CIFv3FiltersController($modalInstance, filters) {
    var vm = this;

    vm.filters = filters;

    vm.itypes = [
        'ipv4',
        'ipv6',
        'fqdn',
        'url'
    ];

    vm.defaultTags = [
        'whitelist',
        'spam',
        'malware',
        'scanner',
        'hijacked',
        'honeypot',
        'botnet',
        'exploit',
        'phishing'
    ];

    vm.valid = function() {
        //angular.element('#filters').removeClass('has-error');

        if (!vm.filters) {
            return false;
        }

        return true;
    };

    vm.save = function() {
        var result = {};

        result.filters = vm.filters;

        $modalInstance.close(result);
    }

    vm.cancel = function() {
        $modalInstance.dismiss();
    }
}

angular.module('cifv3Webui', [])
    .controller('CIFv3SideConfigController', [
        '$scope', 'MinemeldConfigService', 'MineMeldRunningConfigStatusService',
        'toastr', '$modal', 'ConfirmService', '$timeout',
        CIFv3SideConfigController
    ])
    .config(['$stateProvider', function($stateProvider) {
        $stateProvider.state('nodedetail.cifv3info', {
            templateUrl: '/extensions/webui/cifv3Webui/cifv3.miner.info.html',
            controller: 'NodeDetailInfoController',
            controllerAs: 'vm'
        });
    }])
    .run(['NodeDetailResolver', '$state', function(NodeDetailResolver, $state) {
        NodeDetailResolver.registerClass('cifv3.node.Miner', {
            tabs: [{
                icon: 'fa fa-circle-o',
                tooltip: 'INFO',
                state: 'nodedetail.cifv3info',
                active: false
            },
            {
                icon: 'fa fa-area-chart',
                tooltip: 'STATS',
                state: 'nodedetail.stats',
                active: false
            },
            {
                icon: 'fa fa-asterisk',
                tooltip: 'GRAPH',
                state: 'nodedetail.graph',
                active: false
            }]
        });

        // if a nodedetail is already shown, reload the current state to apply changes
        // we should definitely find a better way to handle this...
        if ($state.$current.toString().startsWith('nodedetail.')) {
            $state.reload();
        }
    }]);
})();
