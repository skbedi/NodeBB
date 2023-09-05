

// The next line calls a function in a module that has not been updated to TS yet
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
import async from 'async';

// The next line calls a function in a module that has not been updated to TS yet
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
import db from '../database';

// The next line calls a function in a module that has not been updated to TS yet
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
import user from '../user';

import { TopicSlimProperties } from '../types/topic';

type TopicType = TopicSlimProperties

export = function (Topics) {
    async function getUserBookmark(tid : number, uid : string): Promise<number | null> {
        if (parseInt(uid, 10) <= 0) {
            return null;
        }

        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        return await db.sortedSetScore(`tid:${tid}:bookmarks`, uid);
    }

    async function getUserBookmarks(tids: number[], uid: string): Promise<(number | null)[]> {
        if (parseInt(uid, 10) <= 0) {
            return tids.map(() => null);
        }
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        return await db.sortedSetsScore(tids.map(tid => `tid:${tid}:bookmarks`), uid);
    }

    async function setUserBookmark(tid : number, uid : string, index : string) {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        await db.sortedSetAdd(`tid:${tid}:bookmarks`, index, uid);
    }

    async function getTopicBookmarks(tid : number) {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        return await db.getSortedSetRangeWithScores(`tid:${tid}:bookmarks`, 0, -1);
    }

    async function updateTopicBookmarks(tid : number, pids : number[]) {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const maxIndex: number = await Topics.getPostCount(tid);
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line max-len
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const indices: number[] = await db.sortedSetRanks(`tid:${tid}:posts`, pids);
        const postIndices: number[] = indices.map((i: number) => (i === null ? 0 : i + 1));
        const minIndex: number = Math.min(...postIndices);


        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line max-len
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const bookmarks = await getTopicBookmarks(tid);
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line max-len
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const uidData = bookmarks.map(b => ({ uid: b.value, bookmark: parseInt(b.score, 10) }))
            .filter(data => data.bookmark >= minIndex);
            type CustomData = {
                bookmark : number,
                uid : number
            }
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line max-len
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            await async.eachLimit(uidData, 50, async (data:CustomData) => {
                let bookmark = Math.min(data.bookmark, maxIndex);

                postIndices.forEach((i) => {
                    if (i < data.bookmark) {
                        bookmark -= 1;
                    }
                });

                // make sure the bookmark is valid if we removed the last post
                bookmark = Math.min(bookmark, maxIndex - pids.length);
                if (bookmark === data.bookmark) {
                    return;
                }


                const settings = await user.getSettings(data.uid);
                // The next line calls a function in a module that has not been updated to TS yet
                // eslint-disable-next-line max-len
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                if (settings.topicPostSort === 'most_votes') {
                    return;
                }
                // The next line calls a function in a module that has not been updated to TS yet
                // eslint-disable-next-line max-len
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                await Topics.setUserBookmark(tid, data.uid, bookmark);
            });
    }
};
