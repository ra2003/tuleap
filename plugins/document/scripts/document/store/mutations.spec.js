/*
 * Copyright (c) Enalean, 2018. All Rights Reserved.
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

import * as mutations from "./mutations.js";

describe("Store mutations", () => {
    describe("beginLoading()", () => {
        it("sets loading to true", () => {
            const state = {
                is_loading_folder: false
            };

            mutations.beginLoading(state);

            expect(state.is_loading_folder).toBe(true);
        });
    });

    describe("stopLoading()", () => {
        it("sets loading to false", () => {
            const state = {
                is_loading_folder: true
            };

            mutations.stopLoading(state);

            expect(state.is_loading_folder).toBe(false);
        });
    });

    describe("resetErrors()", () => {
        it("resets all errors", () => {
            const state = {
                has_folder_permission_error: true,
                has_folder_loading_error: true,
                folder_loading_error: "Not found"
            };

            mutations.resetErrors(state);

            expect(state.has_folder_permission_error).toBe(false);
            expect(state.has_folder_loading_error).toBe(false);
            expect(state.folder_loading_error).toBeNull();
        });
    });

    describe("foldFolderContent", () => {
        /**
         *         Folder structure
         *
         *              __0__
         *             /     \
         *           _30      31
         *          /   \
         *        _32    33-
         *       /   \   / \ \
         *    _34    35 40 41 42
         *   /  \   / \     \
         *  36  37 38 39     43
         */
        it("stores the ids of the items to hide and updates which folders do fold which items.", () => {
            const state = {
                folded_by_map: {},
                folded_items_ids: [],
                folder_content: [
                    { id: 30, parent_id: 0 },
                    { id: 32, parent_id: 30 },
                    { id: 34, parent_id: 32 },
                    { id: 36, parent_id: 34 },
                    { id: 37, parent_id: 34 },
                    { id: 35, parent_id: 32 },
                    { id: 38, parent_id: 35 },
                    { id: 39, parent_id: 35 },
                    { id: 33, parent_id: 30 },
                    { id: 40, parent_id: 33 },
                    { id: 41, parent_id: 33 },
                    { id: 43, parent_id: 41 },
                    { id: 42, parent_id: 33 },
                    { id: 31, parent_id: 0 }
                ]
            };

            mutations.foldFolderContent(state, 35);
            expect(state.folded_items_ids).toEqual([38, 39]);
            expect(state.folded_by_map).toEqual({
                "35": [38, 39]
            });

            mutations.foldFolderContent(state, 34);
            expect(state.folded_items_ids).toEqual([38, 39, 36, 37]);
            expect(state.folded_by_map).toEqual({
                "35": [38, 39],
                "34": [36, 37]
            });

            mutations.foldFolderContent(state, 32);
            expect(state.folded_items_ids).toEqual([38, 39, 36, 37, 34, 35]);
            expect(state.folded_by_map).toEqual({
                "35": [38, 39],
                "34": [36, 37],
                "32": [34, 35]
            });
        });
    });

    describe("unfoldFolderContent", () => {
        it("remove all the ids of the children and grand children of a given from state.folded_items_ids.", () => {
            const state = {
                folded_by_map: {
                    "32": [34, 35],
                    "34": [36, 37],
                    "35": [38, 39]
                },
                folded_items_ids: [34, 36, 37, 35, 38, 39],
                folder_content: [
                    { id: 30, parent_id: 0 },
                    { id: 32, parent_id: 30 },
                    { id: 34, parent_id: 32 },
                    { id: 36, parent_id: 34 },
                    { id: 37, parent_id: 34 },
                    { id: 35, parent_id: 32 },
                    { id: 38, parent_id: 35 },
                    { id: 39, parent_id: 35 },
                    { id: 33, parent_id: 30 },
                    { id: 40, parent_id: 33 },
                    { id: 41, parent_id: 33 },
                    { id: 43, parent_id: 41 },
                    { id: 42, parent_id: 33 },
                    { id: 31, parent_id: 0 }
                ]
            };

            mutations.unfoldFolderContent(state, 32);
            expect(state.folded_items_ids).toEqual([36, 37, 38, 39]);
            expect(state.folded_by_map).toEqual({
                "34": [36, 37],
                "35": [38, 39]
            });

            mutations.unfoldFolderContent(state, 34);
            expect(state.folded_items_ids).toEqual([38, 39]);
            expect(state.folded_by_map).toEqual({
                "35": [38, 39]
            });

            mutations.unfoldFolderContent(state, 35);
            expect(state.folded_items_ids).toEqual([]);
            expect(state.folded_by_map).toEqual({});
        });
    });

    describe("appendFolderToAscendantHierarchy", () => {
        it("get all the ids of the direct ascendants", () => {
            const target_folder = { id: 43, parent_id: 41 };
            const state = {
                current_folder_ascendant_hierarchy: [],
                folder_content: [
                    { id: 30, parent_id: 0 },
                    { id: 32, parent_id: 30 },
                    { id: 34, parent_id: 32 },
                    { id: 36, parent_id: 34 },
                    { id: 37, parent_id: 34 },
                    { id: 35, parent_id: 32 },
                    { id: 38, parent_id: 35 },
                    { id: 39, parent_id: 35 },
                    { id: 33, parent_id: 30 },
                    { id: 40, parent_id: 33 },
                    { id: 41, parent_id: 33 },
                    target_folder,
                    { id: 42, parent_id: 33 },
                    { id: 31, parent_id: 0 }
                ]
            };

            mutations.appendFolderToAscendantHierarchy(state, target_folder);
            expect(state.current_folder_ascendant_hierarchy).toEqual([
                { id: 30, parent_id: 0 },
                { id: 33, parent_id: 30 },
                { id: 41, parent_id: 33 },
                target_folder
            ]);
        });
    });

    describe("addJustCreatedItemToFolderContent", () => {
        it("set the level of the new document according to its parent one", () => {
            const item = { id: 66, parent_id: 42, type: "wiki", title: "Document" };
            const state = {
                folder_content: [
                    { id: 42, parent_id: 0, level: 2, type: "folder", title: "Folder" }
                ]
            };

            mutations.addJustCreatedItemToFolderContent(state, item);
            expect(state.folder_content).toEqual([
                { id: 42, parent_id: 0, level: 2, type: "folder", title: "Folder" },
                { id: 66, parent_id: 42, level: 3, type: "wiki", title: "Document" }
            ]);
        });
        it("it default to level=0 if parent is not found (should not happen)", () => {
            const item = { id: 66, parent_id: 42, type: "wiki", title: "Document" };
            const state = {
                folder_content: [
                    { id: 101, parent_id: 0, level: 2, type: "folder", title: "Folder" }
                ]
            };

            mutations.addJustCreatedItemToFolderContent(state, item);
            expect(state.folder_content).toEqual([
                { id: 101, parent_id: 0, level: 2, type: "folder", title: "Folder" },
                { id: 66, parent_id: 42, level: 0, type: "wiki", title: "Document" }
            ]);
        });
        it("it inserts DOCUMENT by respecting the natural sort order", () => {
            const item = { id: 66, parent_id: 42, type: "wiki", title: "A.2.x" };
            const state = {
                folder_content: [
                    { id: 42, parent_id: 0, level: 2, type: "folder", title: "Folder" },
                    { id: 43, parent_id: 42, level: 3, type: "wiki", title: "A.1" },
                    { id: 44, parent_id: 42, level: 3, type: "wiki", title: "A.10" }
                ]
            };

            mutations.addJustCreatedItemToFolderContent(state, item);
            expect(state.folder_content).toEqual([
                { id: 42, parent_id: 0, level: 2, type: "folder", title: "Folder" },
                { id: 43, parent_id: 42, level: 3, type: "wiki", title: "A.1" },
                { id: 66, parent_id: 42, level: 3, type: "wiki", title: "A.2.x" },
                { id: 44, parent_id: 42, level: 3, type: "wiki", title: "A.10" }
            ]);
        });
        it("it inserts DOCUMENT by respecting the natural sort order, and AFTER folders", () => {
            const item = { id: 66, parent_id: 42, type: "wiki", title: "A.2.x" };
            const state = {
                folder_content: [
                    { id: 42, parent_id: 0, level: 2, type: "folder", title: "Folder" },
                    { id: 43, parent_id: 42, level: 3, type: "folder", title: "A.1" },
                    { id: 44, parent_id: 42, level: 3, type: "folder", title: "A.10" },
                    { id: 45, parent_id: 42, level: 3, type: "wiki", title: "A.11" }
                ]
            };

            mutations.addJustCreatedItemToFolderContent(state, item);
            expect(state.folder_content).toEqual([
                { id: 42, parent_id: 0, level: 2, type: "folder", title: "Folder" },
                { id: 43, parent_id: 42, level: 3, type: "folder", title: "A.1" },
                { id: 44, parent_id: 42, level: 3, type: "folder", title: "A.10" },
                { id: 66, parent_id: 42, level: 3, type: "wiki", title: "A.2.x" },
                { id: 45, parent_id: 42, level: 3, type: "wiki", title: "A.11" }
            ]);
        });
        it("it inserts FOLDER by respecting the natural sort order, and BEFORE items", () => {
            const folder = { id: 66, parent_id: 42, type: "folder", title: "D folder" };
            const state = {
                folder_content: [
                    { id: 42, parent_id: 0, level: 2, type: "folder", title: "Folder" },
                    { id: 43, parent_id: 42, level: 3, type: "folder", title: "B folder" },
                    { id: 44, parent_id: 42, level: 3, type: "folder", title: "C folder" },
                    { id: 45, parent_id: 42, level: 3, type: "wiki", title: "A.11" }
                ]
            };
            mutations.addJustCreatedItemToFolderContent(state, folder);
            expect(state.folder_content).toEqual([
                { id: 42, parent_id: 0, level: 2, type: "folder", title: "Folder" },
                { id: 43, parent_id: 42, level: 3, type: "folder", title: "B folder" },
                { id: 44, parent_id: 42, level: 3, type: "folder", title: "C folder" },
                { id: 66, parent_id: 42, level: 3, type: "folder", title: "D folder" },
                { id: 45, parent_id: 42, level: 3, type: "wiki", title: "A.11" }
            ]);
        });
        it("it inserts FOLDER by respecting the natural sort order, and at the right level", () => {
            const folder = { id: 66, parent_id: 43, type: "folder", title: "Z folder" };
            const state = {
                folder_content: [
                    { id: 42, parent_id: 0, level: 2, type: "folder", title: "Folder" },
                    { id: 43, parent_id: 42, level: 3, type: "folder", title: "B folder" },
                    { id: 46, parent_id: 43, level: 4, type: "wiki", title: "B.1" },
                    { id: 44, parent_id: 42, level: 3, type: "folder", title: "D folder" },
                    { id: 45, parent_id: 42, level: 3, type: "wiki", title: "A.11" }
                ]
            };
            mutations.addJustCreatedItemToFolderContent(state, folder);
            expect(state.folder_content).toEqual([
                { id: 42, parent_id: 0, level: 2, type: "folder", title: "Folder" },
                { id: 43, parent_id: 42, level: 3, type: "folder", title: "B folder" },
                { id: 66, parent_id: 43, level: 4, type: "folder", title: "Z folder" },
                { id: 46, parent_id: 43, level: 4, type: "wiki", title: "B.1" },
                { id: 44, parent_id: 42, level: 3, type: "folder", title: "D folder" },
                { id: 45, parent_id: 42, level: 3, type: "wiki", title: "A.11" }
            ]);
        });
        it("it inserts DOCUMENT by respecting the natural sort order, and at the right level", () => {
            const item = { id: 66, parent_id: 43, type: "empty", title: "zzzzempty" };
            const state = {
                folder_content: [
                    { id: 42, parent_id: 0, level: 2, type: "folder", title: "Folder" },
                    { id: 43, parent_id: 42, level: 3, type: "folder", title: "B folder" },
                    { id: 46, parent_id: 43, level: 4, type: "wiki", title: "B.1" },
                    { id: 44, parent_id: 42, level: 3, type: "folder", title: "D folder" },
                    { id: 45, parent_id: 42, level: 3, type: "wiki", title: "A.11" }
                ]
            };
            mutations.addJustCreatedItemToFolderContent(state, item);
            expect(state.folder_content).toEqual([
                { id: 42, parent_id: 0, level: 2, type: "folder", title: "Folder" },
                { id: 43, parent_id: 42, level: 3, type: "folder", title: "B folder" },
                { id: 46, parent_id: 43, level: 4, type: "wiki", title: "B.1" },
                { id: 66, parent_id: 43, level: 4, type: "empty", title: "zzzzempty" },
                { id: 44, parent_id: 42, level: 3, type: "folder", title: "D folder" },
                { id: 45, parent_id: 42, level: 3, type: "wiki", title: "A.11" }
            ]);
        });
        it("it inserts DOCUMENT by respecting the natural sort order, at the end of the folder", () => {
            const item = { id: 66, parent_id: 42, type: "empty", title: "zzzzempty" };
            const state = {
                folder_content: [
                    { id: 42, parent_id: 0, level: 2, type: "folder", title: "Folder" },
                    { id: 43, parent_id: 42, level: 3, type: "folder", title: "B folder" },
                    { id: 46, parent_id: 43, level: 4, type: "wiki", title: "B.1" },
                    { id: 44, parent_id: 42, level: 3, type: "folder", title: "D folder" },
                    { id: 45, parent_id: 42, level: 3, type: "wiki", title: "A.11" }
                ]
            };
            mutations.addJustCreatedItemToFolderContent(state, item);
            expect(state.folder_content).toEqual([
                { id: 42, parent_id: 0, level: 2, type: "folder", title: "Folder" },
                { id: 43, parent_id: 42, level: 3, type: "folder", title: "B folder" },
                { id: 46, parent_id: 43, level: 4, type: "wiki", title: "B.1" },
                { id: 44, parent_id: 42, level: 3, type: "folder", title: "D folder" },
                { id: 45, parent_id: 42, level: 3, type: "wiki", title: "A.11" },
                { id: 66, parent_id: 42, level: 3, type: "empty", title: "zzzzempty" }
            ]);
        });
        it("it inserts FOLDER by respecting the natural sort order, at the end of the folder", () => {
            const folder = { id: 66, parent_id: 43, type: "folder", title: "zzzzfolder" };
            const state = {
                folder_content: [
                    { id: 42, parent_id: 0, level: 2, type: "folder", title: "Folder" },
                    { id: 43, parent_id: 42, level: 3, type: "folder", title: "B folder" },
                    { id: 44, parent_id: 42, level: 3, type: "folder", title: "D folder" },
                    { id: 45, parent_id: 42, level: 3, type: "wiki", title: "A.11" }
                ]
            };
            mutations.addJustCreatedItemToFolderContent(state, folder);
            expect(state.folder_content).toEqual([
                { id: 42, parent_id: 0, level: 2, type: "folder", title: "Folder" },
                { id: 43, parent_id: 42, level: 3, type: "folder", title: "B folder" },
                { id: 66, parent_id: 43, level: 4, type: "folder", title: "zzzzfolder" },
                { id: 44, parent_id: 42, level: 3, type: "folder", title: "D folder" },
                { id: 45, parent_id: 42, level: 3, type: "wiki", title: "A.11" }
            ]);
        });
        it("it inserts DOCUMENT by respecting the natural sort order, at the end of the folder", () => {
            const item = { id: 66, parent_id: 43, type: "empty", title: "zzzzDOCUMENT" };
            const state = {
                folder_content: [
                    { id: 42, parent_id: 0, level: 2, type: "folder", title: "Folder" },
                    { id: 43, parent_id: 42, level: 3, type: "folder", title: "B folder" },
                    { id: 44, parent_id: 42, level: 3, type: "folder", title: "D folder" },
                    { id: 45, parent_id: 42, level: 3, type: "wiki", title: "A.11" }
                ]
            };
            mutations.addJustCreatedItemToFolderContent(state, item);
            expect(state.folder_content).toEqual([
                { id: 42, parent_id: 0, level: 2, type: "folder", title: "Folder" },
                { id: 43, parent_id: 42, level: 3, type: "folder", title: "B folder" },
                { id: 66, parent_id: 43, level: 4, type: "empty", title: "zzzzDOCUMENT" },
                { id: 44, parent_id: 42, level: 3, type: "folder", title: "D folder" },
                { id: 45, parent_id: 42, level: 3, type: "wiki", title: "A.11" }
            ]);
        });
        it("it inserts a FOLDER at the right place, after the last children of its nearest sibling", () => {
            const item = { id: 66, parent_id: 0, type: "folder", title: "B" };
            const state = {
                folder_content: [
                    { id: 42, parent_id: 0, level: 0, type: "folder", title: "A" },
                    { id: 43, parent_id: 42, level: 1, type: "folder", title: "A.A" },
                    { id: 45, parent_id: 42, level: 1, type: "wiki", title: "A kiwi" },
                    { id: 44, parent_id: 0, level: 0, type: "folder", title: "C" }
                ]
            };
            mutations.addJustCreatedItemToFolderContent(state, item);
            expect(state.folder_content).toEqual([
                { id: 42, parent_id: 0, level: 0, type: "folder", title: "A" },
                { id: 43, parent_id: 42, level: 1, type: "folder", title: "A.A" },
                { id: 45, parent_id: 42, level: 1, type: "wiki", title: "A kiwi" },
                { id: 66, parent_id: 0, level: 0, type: "folder", title: "B" },
                { id: 44, parent_id: 0, level: 0, type: "folder", title: "C" }
            ]);
        });
        it("Given newly created items, then thgy should be inserted at the right place", () => {
            const folder_a = { id: 10, title: "A", type: "folder", parent_id: 42, level: 0 };
            const folder_b = { id: 11, title: "B", type: "folder", parent_id: 42, level: 0 };
            const doc_a = { id: 12, title: "A", type: "wiki", parent_id: 42, level: 0 };
            const doc_b = { id: 13, title: "B", type: "wiki", parent_id: 42, level: 0 };
            const sub_folder_a = {
                id: 14,
                title: "A",
                type: "folder",
                parent_id: folder_a.id,
                level: 0
            };
            const sub_folder_b = {
                id: 15,
                title: "B",
                type: "folder",
                parent_id: folder_a.id,
                level: 0
            };
            const sub_doc_a = {
                id: 16,
                title: "A",
                type: "wiki",
                parent_id: folder_a.id,
                level: 0
            };
            const sub_doc_b = {
                id: 17,
                title: "B",
                type: "wiki",
                parent_id: folder_a.id,
                level: 0
            };
            const doc_to_add = { id: 66, title: "A1", type: "wiki", parent_id: 42 };
            const doc_added = { level: 0, ...doc_to_add };
            const doc_to_add_in_folder_a = { ...doc_to_add, parent_id: folder_a.id };
            const doc_added_in_folder_a = { level: 1, ...doc_to_add_in_folder_a };
            const folder_to_add = { id: 69, title: "A1", type: "folder", parent_id: 42 };
            const folder_added = { level: 0, ...folder_to_add };
            const folder_to_add_in_folder_a = { ...folder_to_add, parent_id: folder_a.id };
            const folder_added_in_folder_a = { level: 1, ...folder_to_add_in_folder_a };
            const map = new Map([
                [
                    {
                        item: doc_to_add,
                        folder_content: []
                    },
                    [doc_added]
                ],
                [
                    {
                        item: doc_to_add,
                        folder_content: [doc_a]
                    },
                    [doc_a, doc_added]
                ],
                [
                    {
                        item: doc_to_add,
                        folder_content: [doc_b]
                    },
                    [doc_added, doc_b]
                ],
                [
                    {
                        item: doc_to_add,
                        folder_content: [doc_a, doc_b]
                    },
                    [doc_a, doc_added, doc_b]
                ],
                [
                    {
                        item: doc_to_add,
                        folder_content: [folder_a]
                    },
                    [folder_a, doc_added]
                ],
                [
                    {
                        item: doc_to_add,
                        folder_content: [folder_b]
                    },
                    [folder_b, doc_added]
                ],
                [
                    {
                        item: doc_to_add,
                        folder_content: [folder_a, folder_b]
                    },
                    [folder_a, folder_b, doc_added]
                ],
                [
                    {
                        item: doc_to_add,
                        folder_content: [folder_a, folder_b, doc_a, doc_b]
                    },
                    [folder_a, folder_b, doc_a, doc_added, doc_b]
                ],
                [
                    {
                        item: doc_to_add_in_folder_a,
                        folder_content: [folder_a]
                    },
                    [folder_a, doc_added_in_folder_a]
                ],
                [
                    {
                        item: doc_to_add_in_folder_a,
                        folder_content: [folder_a, folder_b]
                    },
                    [folder_a, doc_added_in_folder_a, folder_b]
                ],
                [
                    {
                        item: doc_to_add_in_folder_a,
                        folder_content: [folder_a, folder_b, doc_a]
                    },
                    [folder_a, doc_added_in_folder_a, folder_b, doc_a]
                ],
                [
                    {
                        item: doc_to_add_in_folder_a,
                        folder_content: [folder_a, folder_b, doc_a, doc_b]
                    },
                    [folder_a, doc_added_in_folder_a, folder_b, doc_a, doc_b]
                ],
                [
                    {
                        item: doc_to_add_in_folder_a,
                        folder_content: [folder_a, sub_doc_a, folder_b, doc_a]
                    },
                    [folder_a, sub_doc_a, doc_added_in_folder_a, folder_b, doc_a]
                ],
                [
                    {
                        item: doc_to_add_in_folder_a,
                        folder_content: [folder_a, sub_doc_b, folder_b, doc_a]
                    },
                    [folder_a, doc_added_in_folder_a, sub_doc_b, folder_b, doc_a]
                ],
                [
                    {
                        item: doc_to_add_in_folder_a,
                        folder_content: [folder_a, sub_doc_a, sub_doc_b, folder_b, doc_a]
                    },
                    [folder_a, sub_doc_a, doc_added_in_folder_a, sub_doc_b, folder_b, doc_a]
                ],
                [
                    {
                        item: doc_to_add_in_folder_a,
                        folder_content: [folder_a, sub_folder_a, folder_b, doc_a]
                    },
                    [folder_a, sub_folder_a, doc_added_in_folder_a, folder_b, doc_a]
                ],
                [
                    {
                        item: doc_to_add_in_folder_a,
                        folder_content: [folder_a, sub_folder_b, folder_b, doc_a]
                    },
                    [folder_a, sub_folder_b, doc_added_in_folder_a, folder_b, doc_a]
                ],
                [
                    {
                        item: doc_to_add_in_folder_a,
                        folder_content: [folder_a, sub_folder_a, sub_folder_b, folder_b, doc_a]
                    },
                    [folder_a, sub_folder_a, sub_folder_b, doc_added_in_folder_a, folder_b, doc_a]
                ],
                [
                    {
                        item: doc_to_add_in_folder_a,
                        folder_content: [
                            folder_a,
                            sub_folder_a,
                            sub_folder_b,
                            sub_doc_a,
                            sub_doc_b,
                            folder_b,
                            doc_a
                        ]
                    },
                    [
                        folder_a,
                        sub_folder_a,
                        sub_folder_b,
                        sub_doc_a,
                        doc_added_in_folder_a,
                        sub_doc_b,
                        folder_b,
                        doc_a
                    ]
                ],
                [
                    {
                        item: folder_to_add,
                        folder_content: []
                    },
                    [folder_added]
                ],
                [
                    {
                        item: folder_to_add,
                        folder_content: [doc_a]
                    },
                    [folder_added, doc_a]
                ],
                [
                    {
                        item: folder_to_add,
                        folder_content: [doc_b]
                    },
                    [folder_added, doc_b]
                ],
                [
                    {
                        item: folder_to_add,
                        folder_content: [doc_a, doc_b]
                    },
                    [folder_added, doc_a, doc_b]
                ],
                [
                    {
                        item: folder_to_add,
                        folder_content: [folder_a]
                    },
                    [folder_a, folder_added]
                ],
                [
                    {
                        item: folder_to_add,
                        folder_content: [folder_b]
                    },
                    [folder_added, folder_b]
                ],
                [
                    {
                        item: folder_to_add,
                        folder_content: [folder_a, folder_b]
                    },
                    [folder_a, folder_added, folder_b]
                ],
                [
                    {
                        item: folder_to_add,
                        folder_content: [folder_a, folder_b, doc_a, doc_b]
                    },
                    [folder_a, folder_added, folder_b, doc_a, doc_b]
                ],
                [
                    {
                        item: folder_to_add_in_folder_a,
                        folder_content: [folder_a]
                    },
                    [folder_a, folder_added_in_folder_a]
                ],
                [
                    {
                        item: folder_to_add_in_folder_a,
                        folder_content: [folder_a, folder_b]
                    },
                    [folder_a, folder_added_in_folder_a, folder_b]
                ],
                [
                    {
                        item: folder_to_add_in_folder_a,
                        folder_content: [folder_a, folder_b, doc_a]
                    },
                    [folder_a, folder_added_in_folder_a, folder_b, doc_a]
                ],
                [
                    {
                        item: folder_to_add_in_folder_a,
                        folder_content: [folder_a, folder_b, doc_a, doc_b]
                    },
                    [folder_a, folder_added_in_folder_a, folder_b, doc_a, doc_b]
                ],
                [
                    {
                        item: folder_to_add_in_folder_a,
                        folder_content: [folder_a, sub_doc_a, folder_b, doc_a]
                    },
                    [folder_a, folder_added_in_folder_a, sub_doc_a, folder_b, doc_a]
                ],
                [
                    {
                        item: folder_to_add_in_folder_a,
                        folder_content: [folder_a, sub_doc_b, folder_b, doc_a]
                    },
                    [folder_a, folder_added_in_folder_a, sub_doc_b, folder_b, doc_a]
                ],
                [
                    {
                        item: folder_to_add_in_folder_a,
                        folder_content: [folder_a, sub_doc_a, sub_doc_b, folder_b, doc_a]
                    },
                    [folder_a, folder_added_in_folder_a, sub_doc_a, sub_doc_b, folder_b, doc_a]
                ],
                [
                    {
                        item: folder_to_add_in_folder_a,
                        folder_content: [folder_a, sub_folder_a, folder_b, doc_a]
                    },
                    [folder_a, sub_folder_a, folder_added_in_folder_a, folder_b, doc_a]
                ],
                [
                    {
                        item: folder_to_add_in_folder_a,
                        folder_content: [folder_a, sub_folder_b, folder_b, doc_a]
                    },
                    [folder_a, folder_added_in_folder_a, sub_folder_b, folder_b, doc_a]
                ],
                [
                    {
                        item: folder_to_add_in_folder_a,
                        folder_content: [folder_a, sub_folder_a, sub_folder_b, folder_b, doc_a]
                    },
                    [
                        folder_a,
                        sub_folder_a,
                        folder_added_in_folder_a,
                        sub_folder_b,
                        folder_b,
                        doc_a
                    ]
                ],
                [
                    {
                        item: folder_to_add_in_folder_a,
                        folder_content: [
                            folder_a,
                            sub_folder_a,
                            sub_folder_b,
                            sub_doc_a,
                            sub_doc_b,
                            folder_b,
                            doc_a
                        ]
                    },
                    [
                        folder_a,
                        sub_folder_a,
                        folder_added_in_folder_a,
                        sub_folder_b,
                        sub_doc_a,
                        sub_doc_b,
                        folder_b,
                        doc_a
                    ]
                ]
            ]);
            map.forEach((expected_content, { item, folder_content }) => {
                const state = { folder_content };
                mutations.addJustCreatedItemToFolderContent(state, item);
                expect(state.folder_content).toEqual(expected_content);
            });
        });
    });

    describe("replaceUploadingFileWithActualFile", () => {
        it("it should replace the fake item by the actual item in the folder content", () => {
            const fake_item = {
                id: 46,
                title: "toto.txt",
                parent_id: 42,
                type: "file",
                file_type: "plain/text",
                is_uploading: true
            };

            const actual_file = {
                id: 46,
                parent_id: 42,
                level: 3,
                type: "file",
                title: "toto.txt"
            };

            const state = {
                folder_content: [
                    { id: 42, parent_id: 0, level: 2, type: "folder", title: "Folder" },
                    { id: 45, parent_id: 42, level: 3, type: "wiki", title: "tata.txt" },
                    { id: 44, parent_id: 42, level: 3, type: "file", title: "titi.txt" },
                    fake_item,
                    { id: 43, parent_id: 42, level: 3, type: "file", title: "tutu.txt" }
                ]
            };

            mutations.replaceUploadingFileWithActualFile(state, [fake_item, actual_file]);

            expect(state.folder_content).toEqual([
                { id: 42, parent_id: 0, level: 2, type: "folder", title: "Folder" },
                { id: 45, parent_id: 42, level: 3, type: "wiki", title: "tata.txt" },
                { id: 44, parent_id: 42, level: 3, type: "file", title: "titi.txt" },
                actual_file,
                { id: 43, parent_id: 42, level: 3, type: "file", title: "tutu.txt" }
            ]);
        });
    });

    describe("removeItemFromFolderContent", () => {
        it("it should remove the item from the folder content", () => {
            const item = {
                id: 46,
                title: "toto.txt",
                parent_id: 42
            };

            const state = {
                folder_content: [
                    { id: 42, parent_id: 0, level: 2, type: "folder", title: "Folder" },
                    { id: 45, parent_id: 42, level: 3, type: "wiki", title: "tata.txt" },
                    { id: 44, parent_id: 42, level: 3, type: "file", title: "titi.txt" },
                    item,
                    { id: 43, parent_id: 42, level: 3, type: "file", title: "tutu.txt" }
                ]
            };

            mutations.removeItemFromFolderContent(state, item);

            expect(state.folder_content).toEqual([
                { id: 42, parent_id: 0, level: 2, type: "folder", title: "Folder" },
                { id: 45, parent_id: 42, level: 3, type: "wiki", title: "tata.txt" },
                { id: 44, parent_id: 42, level: 3, type: "file", title: "titi.txt" },
                { id: 43, parent_id: 42, level: 3, type: "file", title: "tutu.txt" }
            ]);
        });

        it("it should not remove any element if id is not found in array", () => {
            const item = {
                id: 46,
                title: "toto.txt",
                parent_id: 42
            };

            const state = {
                folder_content: [
                    { id: 42, parent_id: 0, level: 2, type: "folder", title: "Folder" },
                    { id: 45, parent_id: 42, level: 3, type: "wiki", title: "tata.txt" }
                ]
            };

            mutations.removeItemFromFolderContent(state, item);

            expect(state.folder_content).toEqual([
                { id: 42, parent_id: 0, level: 2, type: "folder", title: "Folder" },
                { id: 45, parent_id: 42, level: 3, type: "wiki", title: "tata.txt" }
            ]);
        });
    });

    describe("addFileInUploadsList", () => {
        it("it should add the file at the beggining of the upload list", () => {
            const file = {
                id: 5,
                title: "tyty.txt"
            };

            const state = {
                files_uploads_list: [
                    { id: 4, title: "tete.txt" },
                    { id: 3, title: "tata.txt" },
                    { id: 2, title: "titi.txt" },
                    { id: 1, title: "tutu.txt" }
                ]
            };

            mutations.addFileInUploadsList(state, file);

            expect(state.files_uploads_list).toEqual([
                file,
                { id: 4, title: "tete.txt" },
                { id: 3, title: "tata.txt" },
                { id: 2, title: "titi.txt" },
                { id: 1, title: "tutu.txt" }
            ]);
        });
    });

    describe("removeFileFromUploadsList", () => {
        it("it should remove file from the upload list", () => {
            const file = {
                id: 5,
                title: "tyty.txt"
            };

            const state = {
                files_uploads_list: [
                    file,
                    { id: 4, title: "tete.txt" },
                    { id: 3, title: "tata.txt" },
                    { id: 2, title: "titi.txt" },
                    { id: 1, title: "tutu.txt" }
                ]
            };

            mutations.removeFileFromUploadsList(state, file);

            expect(state.files_uploads_list).toEqual([
                { id: 4, title: "tete.txt" },
                { id: 3, title: "tata.txt" },
                { id: 2, title: "titi.txt" },
                { id: 1, title: "tutu.txt" }
            ]);
        });

        it("it should toggle parent has uploading file if all items are canceled", () => {
            const file = {
                id: 5,
                title: "tyty.txt",
                parent_id: 1
            };

            const state = {
                files_uploads_list: [{ id: 5, title: "tyty.txt", parent_id: 1 }],
                folder_content: [
                    {
                        id: 1,
                        title: "My folder",
                        progress: 75,
                        is_uploading_in_collapsed_folder: true
                    }
                ]
            };

            mutations.removeFileFromUploadsList(state, file);

            expect(state.folder_content).toEqual([
                { id: 1, title: "My folder", progress: 0, is_uploading_in_collapsed_folder: false }
            ]);
        });
    });

    describe("initializeFolderProperties", () => {
        it("it should not do anything if folder is not found", () => {
            const folder = {
                id: 5,
                title: "toto.txt"
            };

            const state = {
                folder_content: [{ id: 2, title: "titi.txt" }, { id: 1, title: "tutu.txt" }]
            };

            mutations.initializeFolderProperties(state, folder);

            expect(state.folder_content).toEqual([
                { id: 2, title: "titi.txt" },
                { id: 1, title: "tutu.txt" }
            ]);
        });

        it("it should add new watchable properties for folder", () => {
            const folder = {
                id: 1,
                title: "tutu.txt"
            };

            const state = {
                folder_content: [{ id: 2, title: "titi.txt" }, { id: 1, title: "tutu.txt" }]
            };

            mutations.initializeFolderProperties(state, folder);

            expect(state.folder_content).toEqual([
                { id: 2, title: "titi.txt" },
                {
                    id: 1,
                    title: "tutu.txt",
                    is_uploading_in_collapsed_folder: false,
                    progress: null
                }
            ]);
        });
    });

    describe("toggleCollapsedFolderHasUploadingContent", () => {
        it("it should not do anything if folder is not found", () => {
            const folder = {
                id: 5,
                title: "toto.txt"
            };

            const state = {
                folder_content: [{ id: 2, title: "titi.txt" }, { id: 1, title: "tutu.txt" }]
            };

            mutations.toggleCollapsedFolderHasUploadingContent(state, [folder, true]);

            expect(state.folder_content).toEqual([
                { id: 2, title: "titi.txt" },
                { id: 1, title: "tutu.txt" }
            ]);
        });

        it("it should toggle upload is done in a collapsed folder", () => {
            const folder = {
                id: 1,
                title: "tutu.txt"
            };

            const state = {
                folder_content: [{ id: 2, title: "titi.txt" }, { id: 1, title: "tutu.txt" }]
            };

            mutations.toggleCollapsedFolderHasUploadingContent(state, [folder, true]);

            expect(state.folder_content).toEqual([
                { id: 2, title: "titi.txt" },
                { id: 1, title: "tutu.txt", is_uploading_in_collapsed_folder: true, progress: 0 }
            ]);
        });
    });

    describe("updateFolderProgressbar", () => {
        it("it should not do anything if folder is not found", () => {
            const folder = {
                id: 5,
                title: "toto.txt"
            };

            const state = {
                folder_content: [{ id: 2, title: "titi.txt" }, { id: 1, title: "tutu.txt" }]
            };

            mutations.updateFolderProgressbar(state, folder);

            expect(state.folder_content).toEqual([
                { id: 2, title: "titi.txt" },
                { id: 1, title: "tutu.txt" }
            ]);
        });

        it("it should store the progress of folder by computing the progress of its children", () => {
            const folder = {
                id: 1,
                title: "tutu.txt"
            };

            const state = {
                folder_content: [{ id: 1, title: "tutu.txt", progress: null }],
                files_uploads_list: [
                    { id: 2, title: "tutu.txt", progress: 25, parent_id: 1 },
                    { id: 3, title: "tutu.txt", progress: 50, parent_id: 1 },
                    { id: 4, title: "tutu.txt", progress: 75, parent_id: 1 }
                ]
            };

            mutations.updateFolderProgressbar(state, folder);

            expect(state.folder_content).toEqual([{ id: 1, title: "tutu.txt", progress: 50 }]);
        });
    });

    describe("resetFolderIsUploading", () => {
        it("it should not do anything if folder is not found", () => {
            const folder = {
                id: 5,
                title: "toto.txt"
            };

            const state = {
                folder_content: [{ id: 2, title: "titi.txt" }, { id: 1, title: "tutu.txt" }]
            };

            mutations.resetFolderIsUploading(state, folder);

            expect(state.folder_content).toEqual([
                { id: 2, title: "titi.txt" },
                { id: 1, title: "tutu.txt" }
            ]);
        });

        it("it resets uploading properties of folder", () => {
            const folder = {
                id: 1,
                title: "tutu.txt"
            };

            const state = {
                folder_content: [
                    { id: 2, title: "titi.txt" },
                    {
                        id: 1,
                        title: "tutu.txt",
                        is_uploading_in_collapsed_folder: true,
                        progress: 75
                    }
                ]
            };

            mutations.resetFolderIsUploading(state, folder);

            expect(state.folder_content).toEqual([
                { id: 2, title: "titi.txt" },
                { id: 1, title: "tutu.txt", is_uploading_in_collapsed_folder: false, progress: 0 }
            ]);
        });
    });
});
