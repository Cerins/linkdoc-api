import type { IPubSubGateway, SubListener } from '../interface/pubsub';

class PubSub implements IPubSubGateway {
    private members = new Map<string, Set<string> | undefined>();

    private memberFn = new Map<string, SubListener>();

    private fnKey(room: string, id: string) {
        return `${room}:${id}`;
    }

    async publish(room: string, content: string) {
        const members = this.members.get(room);
        if (members === undefined) {
            return;
        }
        // Theoretically for each is more elegant
        for (const member of members.values()) {
            // Exclamation mark is ok, since the
            // it is guaranteed that each member is registered with a function
            const fn = this.memberFn.get(this.fnKey(room, member))!;
            fn(content);
        }
    }

    async subscribe(room: string, id: string, listener: SubListener) {
        if (!this.members.has(room)) {
            this.members.set(room, new Set());
        }
        // Set is guaranteed since it is setup if not exists
        const members = this.members.get(room)!;
        members.add(id);
        this.memberFn.set(this.fnKey(room, id), listener);
    }

    async unsubscribe(room: string, id: string) {
    // Remove the user from the room
        const members = this.members.get(room);
        if (members !== undefined) {
            members.delete(id);
            if (members.size === 0) {
                this.members.delete(room);
            }
        }
        // Clean up the function which the user used to listen to the room
        this.memberFn.delete(this.fnKey(room, id));
    }
}

export default PubSub;
