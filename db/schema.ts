import {sqliteTable,text,integer,index,uniqueIndex} from 'drizzle-orm/sqlite-core';
export const rooms=sqliteTable('coop_rooms',{
  id:text('id').primaryKey(),owner:text('owner').notNull(),name:text('name').notNull(),
  host:text('host').notNull(),snapshot:text('snapshot').notNull().default(''),
  revision:integer('revision').notNull().default(0),ack:integer('ack').notNull().default(0),
  updated:integer('updated').notNull(),created:integer('created').notNull(),
},t=>[index('coop_rooms_owner').on(t.owner)]);
export const members=sqliteTable('coop_members',{
  id:text('id').primaryKey(),room:text('room').notNull().references(()=>rooms.id,{onDelete:'cascade'}),
  user:text('user').notNull(),secret:text('secret').notNull(),name:text('name').notNull(),
  pose:text('pose').notNull().default('{}'),lastSeq:integer('last_seq').notNull().default(0),
  seen:integer('seen').notNull(),
},t=>[index('coop_members_room_seen').on(t.room,t.seen)]);
export const commands=sqliteTable('coop_commands',{
  id:integer('id').primaryKey({autoIncrement:true}),room:text('room').notNull().references(()=>rooms.id,{onDelete:'cascade'}),
  member:text('member').notNull().references(()=>members.id,{onDelete:'cascade'}),seq:integer('seq').notNull(),
  payload:text('payload').notNull(),
},t=>[index('coop_commands_room_id').on(t.room,t.id),uniqueIndex('coop_commands_member_seq').on(t.member,t.seq)]);
