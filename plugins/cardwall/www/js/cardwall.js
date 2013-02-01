/**
  * Copyright (c) Enalean, 2013. All rights reserved
  *
  * This file is a part of Tuleap.
  *
  * Tuleap is free software; you can redistribute it and/or modify
  * it under the terms of the GNU General Public License as published by
  * the Free Software Foundation; either version 2 of the License, or
  * (at your option) any later version.
  *
  * Tuleap is distributed in the hope that it will be useful,
  * but WITHOUT ANY WARRANTY; without even the implied warranty of
  * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  * GNU General Public License for more details.
  *
  * You should have received a copy of the GNU General Public License
  * along with Tuleap. If not, see <http://www.gnu.org/licenses/
  */
var tuleap = tuleap || { };
tuleap.agiledashboard = tuleap.agiledashboard || { };
tuleap.agiledashboard.cardwall = tuleap.agiledashboard.cardwall || { };
tuleap.agiledashboard.cardwall.tracker_user_data = [ ];
tuleap.agiledashboard.cardwall.card = tuleap.agiledashboard.cardwall.card || { };

tuleap.agiledashboard.cardwall.card.updateAfterAjax = function( transport ) {
    var artifacts_modifications = $H(transport.responseJSON);

    artifacts_modifications.each( function ( artifact ) {
        updateArtifact( artifact );
    });

    function updateArtifact( artifact ) {
        var artifact_id = artifact.key,
            values = artifact.value;

        $H( values ).each( function ( field ) {
            updateArtifactField( artifact_id, field );
        })
    }

    function updateArtifactField( artifact_id, field ) {
        var field_to_update_selector = '.card[data-artifact-id='+ artifact_id +'] .valueOf_' + field.key;

        $$( field_to_update_selector ).each( function ( element_to_update ) {
            updateFieldValue( element_to_update, field.value )
        })
    }

    function updateFieldValue( element, value ) {
        var element_editor = element.down( 'div' );

        if( element_editor ) {
            element_editor.update( value );
        } else {
            element.update( value );
        }
    }
};

tuleap.agiledashboard.cardwall.card.AbstractElementEditor = Class.create({

    fail : function(transport) {
        if( typeof transport === 'undefined' ) {
            return;
        }
        if( typeof console == 'object' && typeof console.error === 'function' ) {
            console.error( transport.responseText.stripTags() );
        }
    },

    userCanEdit : function() {
        return (this.field_id !== null)
    }
});

tuleap.agiledashboard.cardwall.card.TextElementEditor = Class.create(
    tuleap.agiledashboard.cardwall.card.AbstractElementEditor, {

    initialize : function( element ) {
        this.options = { };
        this.setProperties( element );

        if(! this.userCanEdit() ) {
            return;
        }

        var container = this.createAndInjectTemporaryContainer();

        this.options[ 'callback' ]        = this.ajaxCallback();
        this.options[ 'onComplete' ]      = this.success();
        this.options[ 'onFailure' ]       = this.fail;
        this.options[ 'validation' ]      = this.getValidation();

        new Ajax.InPlaceTextEditor( container, this.update_url, this.options );
    },

    setProperties : function ( element ) {
        this.element        = element;
        this.field_id       = element.readAttribute( 'data-field-id' );
        this.artifact_id    = element.up( '.card' ).readAttribute( 'data-artifact-id' );
        this.update_url     = codendi.tracker.base_url + '?func=artifact-update&aid=' + this.artifact_id;
        this.artifact_type  = element.readAttribute( 'data-field-type' );
    },

    createAndInjectTemporaryContainer : function () {
        var clickable     = this.getClickableArea(),
            clickable_div = new Element( 'div' );

        clickable_div.update( clickable );
        this.element.update( clickable_div );

        return clickable_div;
    },

    getClickableArea : function() {
        if( this.element.innerHTML == '' ) {
            return ' - ' ;
        }

        return this.element.innerHTML;
    },

    ajaxCallback : function() {
        var field_id = this.field_id;
        
        return function setRequestData(form, value) {
            var parameters = { },
                linked_field = 'artifact[' + field_id +']';

            parameters[ linked_field ] = value;
            return parameters;
        }
    },

    success : function() {
        return function updateCardInfo( transport ) {
            if( typeof transport != 'undefined' ) {
                tuleap.agiledashboard.cardwall.card.updateAfterAjax( transport );
            }
        }
    },

    getValidation : function() {
        var pattern,
            message;
            
        switch (this.artifact_type ) {
            case 'float':
                pattern = '[0-9]*(\.[0-9]*)?';
                message = 'the value must be a decimal';
                break;
            case 'int':
                pattern = '[0-9]*';
                message = 'the value must be an integer';
                break;
            default:
                pattern = '.';
                message = '';
        }

        return {
            'pattern' : pattern,
            'message' : message
        }
    }
});

tuleap.agiledashboard.cardwall.card.SelectElementEditor = Class.create(
    tuleap.agiledashboard.cardwall.card.AbstractElementEditor, {

    initialize : function( element ) {
        this.setProperties( element );
    
        if(! this.userCanEdit() ) {
            return;
        }

        this.fetchUserData();
        this.addOptions();

        var container = this.createAndInjectTemporaryContainer();
        var editor;

        editor = new Ajax.InPlaceMultiCollectionEditor(
            container,
            this.update_url,
            this.options
        );

        this.bindSelectedElementsToEditor(editor);
    },
    
    setProperties : function( element ) {
        this.element           = element;
        this.options           = { };
        this.tracker_user_data = [ ];

        this.field_id       = element.readAttribute( 'data-field-id' );
        this.artifact_id    = element.up( '.card' ).readAttribute( 'data-artifact-id' );
        this.artifact_type  = element.readAttribute( 'data-field-type' );

        this.update_url     = codendi.tracker.base_url + '?func=artifact-update&aid=' + this.artifact_id;
        this.collection_url = codendi.tracker.base_url + '?func=get-values&formElement=' + this.field_id;

        this.users          = { };
    },

    fetchUserData : function() {
        this.tracker_user_data = tuleap.agiledashboard.cardwall.tracker_user_data;
    },

    isMultipleSelect : function () {
        return this.artifact_type === 'msb';
    },

    addOptions : function() {
        this.options[ 'multiple' ]      = this.isMultipleSelect();
        this.options[ 'collection' ]    = this.getAvailableUsers();
        this.options[ 'element' ]       = this.element;
        this.options[ 'callback' ]      = this.preRequestCallback();
        this.options[ 'onComplete' ]    = this.success();
        this.options[ 'onFailure' ]     = this.fail;
    },

    bindSelectedElementsToEditor : function( editor ) {
        editor.getSelectedUsers = function() {
            var avatars = $$('.valueOf_assigned_to .cardwall_avatar');
            var users = { };

            avatars.each( function( avatar ) {
                var id      = avatar.readAttribute( 'data-user-id' );
                users[ id ] = avatar.readAttribute( 'title' );
            });
            this.options.selected = users;
        };
    },

    createAndInjectTemporaryContainer : function () {
        var clickable     = this.getClickableArea(),
            clickable_div = new Element( 'div' );

        clickable_div.update( clickable );
        this.element.update( clickable_div );

        return clickable_div;
    },

    getClickableArea : function() {
        if( this.element.innerHTML == '' ) {
            return ' - ' ;
        }

        return this.element.innerHTML;
    },

    getAvailableUsers : function() {
        var user_collection = [];

        if ( $H( this.users ).size() == 0 ) {
            this.users = this.tracker_user_data[ this.field_id ] || [];
        }

        if ( $H( this.users ).size() == 0 ) {
            this.fetchUsers();
        }

        jQuery.each( this.users, function( id, user_details ){
            if( typeof( user_details ) !== 'undefined' ) {
                user_collection.push( [ user_details.id, user_details.caption ] );
            }
        });

        return user_collection;
    },

    fetchUsers : function() {
        var users = { };

        jQuery.ajax({
            url   : this.collection_url,
            async : false
        }).done(function ( data ) {
            jQuery.each(data, function( id, user_details ) {
                users[ id ] = user_details;
            });
        }).fail( function() {
            users = { };
        });

        this.users = users;
        this.tracker_user_data[ this.field_id ] = users;

        tuleap.agiledashboard.cardwall.tracker_user_data[ this.field_id ] = users;
    },

    preRequestCallback : function() {
        var field_id        = this.field_id,
            is_multi_select = this.isMultipleSelect();

        return function setRequestData( form, value ) {
            var parameters = { };
            if ( is_multi_select ) {
                linked_field = 'artifact[' + field_id +'][]';
            } else {
                linked_field = 'artifact[' + field_id +']';
            }

            parameters[ linked_field ] = value;
            return parameters;
        }
    },

    success : function() {
        var field_id          = this.field_id,
            is_multi_select   = (this.isMultipleSelect() === true),
            tracker_user_data = this.tracker_user_data;

        return function updateCardInfo( transport, element ) {
            var new_values;

            if( typeof transport === 'undefined' ) {
                return;
            }

            element.update( '' );
            new_values = getNewValues( transport, is_multi_select, field_id );
            updateAvatarDiv( element, new_values );

            function getNewValues(transport, is_multi_select, field_id) {
                var new_values;

                if ( is_multi_select ) {
                    new_values = transport.request.parameters[ 'artifact[' + field_id + '][]' ];
                } else {
                    new_values = transport.request.parameters[ 'artifact[' + field_id + ']' ];
                }

                return new_values;
            }

            function updateAvatarDiv( avatar_div, new_values ) {
                var div_html;

                if(new_values instanceof Array) {
                    for(var i=0; i<new_values.length; i++) {
                        div_html = generateAvatarDiv( new_values[i] );
                        avatar_div.appendChild( div_html );
                    }
                } else if( typeof new_values === 'string' ){
                    div_html = generateAvatarDiv( new_values );
                    avatar_div.appendChild( div_html );
                } else {
                    avatar_div.update( ' - ' );
                }
            }

            function generateAvatarDiv( user_id ) {
                var username = tracker_user_data[ field_id ][ user_id ][ 'username' ],
                    caption = tracker_user_data[ field_id ][ user_id ][ 'caption' ],
                    structure_div,
                    avatar_img,
                    avatar_div;

                structure_div = new Element( 'div' );

                avatar_div = new Element( 'div' );
                avatar_div.addClassName( 'cardwall_avatar' );
                avatar_div.writeAttribute( 'title', caption );
                avatar_div.writeAttribute( 'data-user-id', user_id );

                avatar_img = new Element('img')
                avatar_img.writeAttribute('src','/users/' + username + '/avatar.png');
                avatar_img.observe('load', function() {
                    if( this.width == 0 || this.height == 0 ) {
                        return;
                    }
                    avatar_div.appendChild(avatar_img);
                });

                structure_div.appendChild( avatar_div );
                structure_div.addClassName( 'avatar_structure_div' );

                return structure_div;
            }
        }
    }
});