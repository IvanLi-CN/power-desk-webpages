CREATE TABLE `protector_series_items` (
	`id` integer PRIMARY KEY NOT NULL,
	`device_id` text NOT NULL,
	`timestamp` integer NOT NULL,
	`values` blob NOT NULL,
	FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON UPDATE no action ON DELETE no action
);
