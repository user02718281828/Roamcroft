CREATE TABLE `coop_commands` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`room` text NOT NULL,
	`member` text NOT NULL,
	`seq` integer NOT NULL,
	`payload` text NOT NULL,
	FOREIGN KEY (`room`) REFERENCES `coop_rooms`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`member`) REFERENCES `coop_members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `coop_commands_room_id` ON `coop_commands` (`room`,`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `coop_commands_member_seq` ON `coop_commands` (`member`,`seq`);--> statement-breakpoint
CREATE TABLE `coop_members` (
	`id` text PRIMARY KEY NOT NULL,
	`room` text NOT NULL,
	`user` text NOT NULL,
	`secret` text NOT NULL,
	`name` text NOT NULL,
	`pose` text DEFAULT '{}' NOT NULL,
	`seen` integer NOT NULL,
	`last_seq` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`room`) REFERENCES `coop_rooms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `coop_members_room_seen` ON `coop_members` (`room`,`seen`);--> statement-breakpoint
CREATE TABLE `coop_rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`host` text NOT NULL,
	`snapshot` text DEFAULT '' NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`ack` integer DEFAULT 0 NOT NULL,
	`updated` integer NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `coop_rooms_owner` ON `coop_rooms` (`owner`);