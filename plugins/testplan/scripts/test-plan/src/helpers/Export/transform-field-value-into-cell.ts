/*
 * Copyright (c) Enalean, 2020-Present. All Rights Reserved.
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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Tuleap. If not, see <http://www.gnu.org/licenses/>.
 */

import { EmptyCell, HTMLCell, NumberCell, ReportCell, TextCell } from "./report-cells";
import { TextValueField, TrackerFieldValue } from "./artifact";

export function transformFieldValueIntoACell(
    field_value: Readonly<TrackerFieldValue>
): ReportCell | null {
    switch (field_value.type) {
        case "string":
            return new TextCell(field_value.value);
        case "text":
            return transformTextFieldValueIntoACell(field_value);
        case "int":
        case "float":
            return getCellFromPossibleNumber(field_value.value);
        case "computed": {
            let value;
            if (field_value.is_autocomputed) {
                value = field_value.value;
            } else {
                value = field_value.manual_value;
            }
            return getCellFromPossibleNumber(value);
        }
        default:
            return null;
    }
}

function getCellFromPossibleNumber(n: number | null): NumberCell | EmptyCell {
    if (n === null) {
        return new EmptyCell();
    }

    return new NumberCell(n);
}

export function transformTextFieldValueIntoACell(
    text_field_value: TextValueField
): TextCell | HTMLCell {
    if (text_field_value.format === "text") {
        return new TextCell(text_field_value.value);
    }

    return new HTMLCell(text_field_value.value);
}
