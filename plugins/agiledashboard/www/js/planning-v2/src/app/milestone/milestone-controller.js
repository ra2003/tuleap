angular
    .module('milestone')
    .controller('MilestoneController', MilestoneController);


MilestoneController.$inject = [
    '$scope',
    '$timeout',
    '$document',
    'dragularService',
    'BacklogService',
    'DroppedService',
    'MilestoneCollectionService',
    'BacklogItemSelectedService'
];

function MilestoneController(
    $scope,
    $timeout,
    $document,
    dragularService,
    BacklogService,
    DroppedService,
    MilestoneCollectionService,
    BacklogItemSelectedService
) {
    var self = this;
    _.extend(self, {
        milestone                      : $scope.milestone, //herited from parent scope
        dragular_instance_for_milestone: undefined,
        init                           : init,
        initDragularForMilestone       : initDragularForMilestone,
        dragularOptionsForMilestone    : dragularOptionsForMilestone,
        isMilestoneLoadedAndEmpty      : isMilestoneLoadedAndEmpty,
        toggleMilestone                : toggleMilestone
    });

    self.init();

    function init() {
        $scope.$on('dragularcancel', dragularCancel);
        $scope.$on('dragulardrop', dragularDrop);
        $scope.$on('dragulardrag', dragularDrag);
    }

    function toggleMilestone($event) {
        if (! self.milestone.alreadyLoaded && self.milestone.content.length === 0) {
            self.milestone.getContent();
        }

        var target                = $event.target;
        var is_a_create_item_link = false;

        if (target.classList) {
            is_a_create_item_link = target.classList.contains('create-item-link');
        } else {
            is_a_create_item_link = target.parentNode.getElementsByClassName("create-item-link")[0] !== undefined;
        }

        if (! is_a_create_item_link) {
            self.milestone.collapsed = ! self.milestone.collapsed;
        }

        if (! self.dragular_instance_for_milestone) {
            $timeout(function() {
                self.initDragularForMilestone();
            });
        }
    }

    function isMilestoneLoadedAndEmpty() {
        return ! self.milestone.loadingContent && self.milestone.content.length === 0;
    }

    function initDragularForMilestone() {
        self.dragular_instance_for_milestone = dragularService(document.querySelector('ul.submilestone[data-submilestone-id="'+ self.milestone.id +'"]'), self.dragularOptionsForMilestone());

        $document.bind('keyup', function(event) {
            var esc_key_code = 27;

            if (event.keyCode === esc_key_code) {
                BacklogItemSelectedService.deselectAllBacklogItems();

                self.dragular_instance_for_milestone.cancel(true);

                $scope.$apply();
            }
        });
    }

    function dragularOptionsForMilestone() {
        return {
            containersModel: self.milestone.content,
            scope          : $scope,
            revertOnSpill  : true,
            nameSpace      : 'dragular-list',
            accepts        : isItemDroppable,
            moves          : isItemDraggable
        };
    }

    function dragularDrag(event, element) {
        event.stopPropagation();

        if (BacklogItemSelectedService.areThereMultipleSelectedBaklogItems() &&
            BacklogItemSelectedService.isDraggedBacklogItemSelected(getDroppedItemId(element))
        ) {
            BacklogItemSelectedService.multipleBacklogItemsAreDragged(element);

        } else {
            BacklogItemSelectedService.deselectAllBacklogItems();
        }

        $scope.$apply();
    }

    function dragularCancel(event, dropped_item_element, source_element) {
        event.stopPropagation();

        BacklogItemSelectedService.deselectAllBacklogItems();
        $scope.$apply();
    }

    function dragularDrop(
        event,
        dropped_item_element,
        target_element,
        source_element,
        source_model,
        initial_index,
        target_model,
        target_index
    ) {
        event.stopPropagation();

        var source_list_element  = angular.element(source_element),
            target_list_element  = angular.element(target_element),
            dropped_item_ids     = [getDroppedItemId(dropped_item_element)],
            current_milestone_id = getMilestoneId(target_list_element);

        if (! target_model) {
            target_model = source_model;
        }

        var dropped_items = [target_model[target_index]];

        if (BacklogItemSelectedService.areThereMultipleSelectedBaklogItems()) {
            dropped_items    = BacklogItemSelectedService.getCompactedSelectedBacklogItem();
            dropped_item_ids = _.pluck(dropped_items, 'id');
        }

        var compared_to = DroppedService.defineComparedTo(target_model, target_model[target_index], dropped_items);

        saveChangesInBackend();

        function saveChangesInBackend() {
            var dropped_promise,
                source_milestone_id = getMilestoneId(source_list_element);

            switch (true) {
                case droppedToSameMilestone(source_list_element, target_list_element):
                    MilestoneCollectionService.addOrReorderBacklogItemsInMilestoneContent(current_milestone_id, dropped_items, compared_to);

                    dropped_promise = DroppedService.reorderSubmilestone(
                        dropped_item_ids,
                        compared_to,
                        current_milestone_id
                    ).then(function() {
                        BacklogItemSelectedService.deselectAllBacklogItems();
                    });
                    break;

                case droppedToAnotherMilestone(source_list_element, target_list_element):
                    var target_milestone_id = getMilestoneId(target_list_element);

                    MilestoneCollectionService.removeBacklogItemsFromMilestoneContent(source_milestone_id, dropped_items);
                    MilestoneCollectionService.addOrReorderBacklogItemsInMilestoneContent(target_milestone_id, dropped_items, compared_to);

                    dropped_promise =DroppedService.moveFromSubmilestoneToSubmilestone(
                        dropped_item_ids,
                        compared_to,
                        source_milestone_id,
                        target_milestone_id
                    ).then(function() {
                        BacklogItemSelectedService.deselectAllBacklogItems();
                        MilestoneCollectionService.refreshMilestone(source_milestone_id);
                        MilestoneCollectionService.refreshMilestone(target_milestone_id);
                    });
                    break;

                case droppedToBacklog(target_list_element):
                    MilestoneCollectionService.removeBacklogItemsFromMilestoneContent(source_milestone_id, dropped_items);
                    BacklogService.addOrReorderBacklogItemsInBacklog(dropped_items, compared_to);

                    dropped_promise = DroppedService.moveFromSubmilestoneToBacklog(
                        dropped_item_ids,
                        compared_to,
                        source_milestone_id,
                        BacklogService.backlog
                    ).then(function() {
                        BacklogItemSelectedService.deselectAllBacklogItems();
                        MilestoneCollectionService.refreshMilestone(source_milestone_id);
                    });
                    break;
            }

            dropped_promise.catch(function() {
                BacklogItemSelectedService.reselectBacklogItems();
            });
        }
    }

    function droppedToSameMilestone(source_list_element, target_list_element) {
        return getMilestoneId(source_list_element) === getMilestoneId(target_list_element);
    }

    function droppedToAnotherMilestone(source_list_element, target_list_element) {
        return isAMilestone(source_list_element) && isAMilestone(target_list_element);
    }

    function droppedToBacklog(target_list_element) {
        return isBacklog(target_list_element);
    }

    function isAMilestone(element) {
        return element.hasClass('submilestone');
    }

    function isBacklog(element) {
        return element.hasClass('backlog');
    }

    function getMilestoneId(milestone_element) {
        return milestone_element.data('submilestone-id');
    }

    function getDroppedItemId(dropped_item) {
        return angular
            .element(dropped_item)
            .data('item-id');
    }

    function isItemDroppable(element_to_drop, target_container_element) {
        var target_container = angular.element(target_container_element);

        if (target_container.data('nodrop')) {
            return false;
        }

        var accepted = target_container.data('accept').split('|'),
            type     = angular.element(element_to_drop).data('type');

        return _(accepted).contains(type);
    }

    function isItemDraggable(element_to_drag, container, handle_element) {
        return ! preventDrag(element_to_drag) &&
            ancestorHasHandleClass(handle_element);
    }

    function ancestorHasHandleClass(handle_element) {
        return angular.element(handle_element)
            .closest('.dragular-handle').length > 0;
    }

    function preventDrag(element_to_drag) {
        return angular.element(element_to_drag).data('nodrag');
    }
}
