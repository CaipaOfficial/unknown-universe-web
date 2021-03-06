class shop {
    constructor(USER_ID, PLAYER_ID, SERVER_IP, PET, ADMIN) {
        shop.USER_ID = USER_ID;
        shop.PLAYER_ID = PLAYER_ID;
        shop.SERVER_IP = SERVER_IP;
        shop.IS_ADMIN = ADMIN;
        shop.pet = PET;
        shop.category = "SHIPS";
        shop.data = null;
        shop.render();
        shop.packets = {
            ammo: 'update_ammo',
            drones: 'new_drone',
            formation: 'new_form',
            pet: 'new_pet',
            pet_fuel: 'refuel',
            notlisted: 'new_drone'
        };

        shop.ids = {
            ammo_ids: [],
            formation_ids: [],
            drone_ids: []
        };
        sendQuietRequest('shop', 'category_ids', { category: 'ammo' }, function (ammo_data) {
            shop.ids.ammo_ids = ammo_data;
        });
        sendQuietRequest('shop', 'category_ids', { category: 'drone' }, function (drone_data) {
            shop.ids.drone_ids = drone_data;
        });
        sendQuietRequest('shop', 'category_ids', { category: 'drone_formation' }, function (form_data) {
            shop.ids.formation_ids = form_data;
        });
    }

    /**
     * preRender Function
     * Clear HTML
     */
    static preRender() {
        $('.item-list .mCSB_container > div').remove();
        $('.single-item .single-item-content .single-item-buy-menu .buy-btn').unbind('click');
        $('.amount-select .item-quantity').unbind('change');
        $('.amount-select .add-button').unbind('click');
        shop.clearItemView();
    }


    /**
     * render Function
     * renders the Shop (displays everything)
     *
     * @param data
     */
    static render(data = null) {
        if (shop.data === null && data === null) {
            let params = {
                "CATEGORY": shop.category
            };
            shop.sendRequest('render', 'load', params);
        } else {
            if (data !== null) {
                shop.data = data;
            }

            shop.preRender();

            let ITEMS = shop.data;

            ITEMS.forEach(function (ITEM, INDEX) {
                if (ITEM.SHOW_FUEL ||
                    ITEM.SHOW_CATS ||
                    ITEM.HAS_PET ||
                    ITEM.HAS_MAX_IRIS ||
                    ITEM.hasShip ||
                    ITEM.hasDesign
                    ||
                    ITEM.hasFormation) {

                } else {
                    let ItemDIV = $('<div>').addClass('item').attr('data-item-id', INDEX),
                        ItemIMG = $('<div>').addClass('item-image'),
                        ItemPRICE = $('<span>').addClass('item-price');

                    let IMG_URL = ITEM.IMAGE_URL;
                    $(ItemIMG).attr('style', 'background-image: url("' + IMG_URL + '")');

                    let CURRENCY = (
                        ITEM.CURRENCY === 1 ? "C" : "U"
                    );
                    $(ItemPRICE).text(parseFloat(ITEM.PRICE).format(2, 3, ',', '.') + CURRENCY);

                    $('.item-list .mCSB_container').append($(ItemDIV).append(ItemIMG).append(ItemPRICE));
                }
            });

            shop.activateShop();
        }
    }

    /**
     * activateShop Function
     * registers all needed Event-Listners for Shop
     *
     */
    static activateShop() {
        $('#item-info-box').hide();
        $('.item-list .item').click(function (event) {
            $('#item-info-box').show(500);
            let ITEM_ID = $(this).data('item-id'),
                ITEM = shop.data[ITEM_ID];

            shop.clearItemView();

            if (ITEM.AMOUNT_SELECTABLE) {
                $('.single-item .single-item-content .single-item-buy-menu .amount-select').show();
                $('.single-item .single-item-content .single-item-buy-menu .level-select').hide();
            } else if (ITEM.LEVEL_SELECTABLE) {
                $('.single-item .single-item-content .single-item-buy-menu .level-select').show();
                $('.single-item .single-item-content .single-item-buy-menu .amount-select').hide();
            } else {
                $('.single-item .single-item-content .single-item-buy-menu .amount-select').hide();
                $('.single-item .single-item-content .single-item-buy-menu .level-select').hide();
            }

            if (ITEM.IS_PET) {
                $('.single-item .single-item-content .pet-name').show();
                $('.single-item .single-item-content .pet-name-label').show();
            } else {
                $('.single-item .single-item-content .pet-name').hide();
                $('.single-item .single-item-content .pet-name-label').hide();
            }

            $('.single-item .single-item-content .single-item-description h3').text(ITEM.NAME);
            $('.single-item .single-item-content .single-item-description p').text(ITEM.DESCRIPTION);
            $('.single-item .single-item-image').append($('<img>').attr('src', ITEM.SHOP_IMAGE_URL).attr(
                'alt',
                ITEM.NAME
            ));

            let CURRENCY = (
                ITEM.CURRENCY === 1 ? "C" : "U"
            );

            $('.single-item .single-item-content .single-item-buy-menu .item-price').text(parseFloat(ITEM.PRICE).format(
                2,
                0,
                ',',
                '.'
            ) + CURRENCY);
            $('.single-item .single-item-content .single-item-buy-menu .buy-btn').data('item-id', ITEM_ID);

            for (let ATTRIBUTE in ITEM.ATTRIBUTES) {
                if (ITEM.ATTRIBUTES.hasOwnProperty(ATTRIBUTE)) {
                    let ATTR_NAME = ATTRIBUTE,
                        ATTR_VAL = ITEM.ATTRIBUTES[ATTRIBUTE];
                    if (ATTR_VAL === 'NULL' || ATTR_VAL === null) continue;
                    $('.single-item .single-item-content .single-item-description ul').append($('<li>').text(ATTR_NAME +
                        ": " +
                        ATTR_VAL));
                }
            }
        });

        $('.amount-select .add-button').click(function (event) {
            const QTY = $('.amount-select .item-quantity');
            let TO_ADD = parseInt($(this).data('add')),
                CURRENT = parseInt(QTY.val());

            QTY.val(TO_ADD + CURRENT).change();
        });

        $('.amount-select .item-quantity').on('change', function () {
            let ITEM_ID = $('.single-item .single-item-content .single-item-buy-menu .buy-btn').data('item-id'),
                ITEM = shop.data[ITEM_ID],
                AMOUNT = parseInt($(this).val());
            let CURRENCY = (
                ITEM.CURRENCY === 1 ? "C" : "U"
            );
            $('.single-item .single-item-content .single-item-buy-menu .item-price').text((
                    ITEM.PRICE * AMOUNT
                ).format(2, 0, ',', '.') +
                CURRENCY);
        });


        $('.single-item .single-item-content .single-item-buy-menu .buy-btn').click(function (event) {
            let ITEM_ID = $(this).data('item-id');
            let ITEM_LVL = $('.level-select .selected').data('level');
            if (ITEM_ID !== undefined) {
                if (!shop.data[ITEM_ID].LEVEL_SELECTABLE) {
                    ITEM_LVL = 1;
                }
                shop.buyItem(shop.data[ITEM_ID].ID, $('.amount-select .item-quantity').val(), ITEM_LVL);
            }
        });

        $('.single-item .single-item-content .single-item-buy-menu .lvl-btn').click(function (event) {
            let ITEM_ID = $('.single-item .single-item-content .single-item-buy-menu .buy-btn').data('item-id'),
                ITEM = shop.data[ITEM_ID],
                LVL = $(this).data('level');
            let CURRENCY = (
                ITEM.CURRENCY === 1 ? "C" : "U");
            $('.single-item .single-item-content .single-item-buy-menu .lvl-btn').removeClass('selected');
            $(this).addClass('selected');
            $('.single-item .single-item-content .single-item-buy-menu .item-price').text((
                    ITEM.PRICE * LVL
                ).format(2, 0, ',', '.') +
                CURRENCY);
        });
    }

    /**
     * clearItemView Function
     * clears Single Item HTML
     *
     */
    static clearItemView() {
        $('.single-item .single-item-content .single-item-description h3').text("-- No Item selected --");
        $('.single-item .single-item-content .single-item-description p').text("Select an item in the list below.");
        $('.single-item .single-item-content .single-item-description ul li').remove();
        $('.single-item .single-item-image img').remove();
        $('.single-item .single-item-content .single-item-buy-menu .buy-btn').removeData('item-id');
        $('.single-item .single-item-content .single-item-buy-menu .item-price').text("");
        $('.amount-select .item-quantity').val(1);
        $('.single-item .single-item-content .single-item-buy-menu .lvl-btn').removeClass('selected');
        $('.single-item .single-item-content .single-item-buy-menu .lvl-btn').first().addClass("selected");
    }

    /**
     * reload Function
     * refreshs shop data by ajax call
     *
     * @param data
     */
    static reload(data = null) {
        if (data === null) {
            let params = {
                "CATEGORY": shop.category
            };
            shop.sendRequest('reload', 'load', params);
        } else {
            shop.data = data;
            shop.render();
        }
    }


    /**
     * switchCategory
     * switches category
     *
     * @param category
     */
    static switchCategory(category = null) {
        if (category !== null) {
            shop.category = category;
            shop.reload();
        }
    }

    /**
     * buyItem
     * sends a request to buy an Item
     *
     * @param ITEM_ID
     * @param AMOUNT
     * @param LEVEL
     */
    static buyItem(ITEM_ID, AMOUNT, LEVEL) {
        let params = {
            "CATEGORY": shop.category,
            "ITEM_ID": ITEM_ID,
            "AMOUNT": AMOUNT,
            "LEVEL" : LEVEL,
        };
        shop.lastBoughtID = ITEM_ID;
        shop.sendRequest('buyCallback', 'buy', params);
    }

    static buyCallback(data) {
        if (data.status === "success") {
            swal("Success!", data.message, "success");
            let action = shop.packets[shop.category];

            if (shop.category === 'ammo'
                || shop.category === 'pet'
                || shop.category === 'pet_fuel'
            ) {
                shop.sendPacket(action);
            } else if (shop.category === 'drones' || shop.category === 'notlisted') {
                let params = data.param;

                if (shop.lastBoughtID in shop.ids.formation_ids) {
                    action = shop.packets.formation;
                } else if (shop.lastBoughtID in shop.ids.ammo_ids) {
                    action = shop.packets.ammo;
                } else if (shop.lastBoughtID in shop.ids.drone_ids) {
                    action = shop.packets.drones;
                }

                shop.sendPacket(action, params);
            }
            shop.reload();
        } else {
            swal("Error!", data.message, "error");
        }
    }

    /**
     * sendPacket Function
     * sends packet to emulator
     *
     * @param action
     * @param params
     */
    static sendPacket(action, params = []) {
        let paramStr = '';
        if (params.length > 0) {
            paramStr = '|';
            for (let param of params) {
                paramStr += '|' + param;
            }
            paramStr = paramStr.substring(0, paramStr.length - 1);
        }

        sendGamePacket('shop|' + shop.PLAYER_ID + '|' + action + paramStr);
    }


    /**
     * sendRequest Function
     * sends request to ajax handler
     *
     * @param callback
     * @param action
     * @param params
     */
    static sendRequest(callback, action, params = "") {
        let data = {
            'handler': 'shop',
            'action': action,
            'params': params
        };

        $.ajax({
            type: "POST",
            url: './core/ajax/ajax.php',
            data: data,
            cache: false,
            xhrFields: {
                withCredentials: true
            },
            success: function (data, statusText) {
                data.status = statusText;
                shop[callback](data);
            },
            error: (errorData, _, errorThrown) => {
                if (data !== null) {
                    swal(
                        errorThrown + '!',
                        errorData.responseJSON.message || errorThrown,
                        'error'
                    );
                }
            },
        });
    }
}
