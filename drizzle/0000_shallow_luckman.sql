CREATE TABLE "models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"timeframe" varchar(10) NOT NULL,
	"version" varchar(50) NOT NULL,
	"training_start" timestamp NOT NULL,
	"training_end" timestamp NOT NULL,
	"num_symbols" integer NOT NULL,
	"top_symbols" jsonb,
	"accuracy_avg" numeric(5, 4),
	"feature_count" integer,
	"model_path" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT false,
	"trained_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "prediction_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prediction_id" uuid NOT NULL,
	"step_number" integer NOT NULL,
	"timestamp" timestamp NOT NULL,
	"open" numeric(20, 8) NOT NULL,
	"high" numeric(20, 8) NOT NULL,
	"low" numeric(20, 8) NOT NULL,
	"close" numeric(20, 8) NOT NULL,
	"confidence" numeric(5, 4),
	"direction" varchar(10),
	"actual_close" numeric(20, 8),
	"is_accurate" boolean
);
--> statement-breakpoint
CREATE TABLE "predictions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"symbol_id" uuid NOT NULL,
	"user_id" uuid,
	"timeframe" varchar(10) NOT NULL,
	"model_id" uuid NOT NULL,
	"prediction_date" timestamp NOT NULL,
	"predict_until" timestamp NOT NULL,
	"num_steps" integer NOT NULL,
	"confidence_avg" numeric(5, 4),
	"direction" varchar(10),
	"key_indicators" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "symbols" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticker" varchar(20) NOT NULL,
	"name" varchar(255) NOT NULL,
	"base_currency" varchar(10),
	"quote_currency" varchar(10),
	"is_active" boolean DEFAULT true,
	"volume_24h_usd" numeric(20, 2),
	"volume_rank" integer,
	"last_updated" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "symbols_ticker_unique" UNIQUE("ticker")
);
--> statement-breakpoint
ALTER TABLE "prediction_steps" ADD CONSTRAINT "prediction_steps_prediction_id_predictions_id_fk" FOREIGN KEY ("prediction_id") REFERENCES "public"."predictions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_symbol_id_symbols_id_fk" FOREIGN KEY ("symbol_id") REFERENCES "public"."symbols"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_models_timeframe" ON "models" USING btree ("timeframe");--> statement-breakpoint
CREATE INDEX "idx_models_active" ON "models" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_models_timeframe_version" ON "models" USING btree ("timeframe","version");--> statement-breakpoint
CREATE INDEX "idx_prediction_steps_prediction_id" ON "prediction_steps" USING btree ("prediction_id");--> statement-breakpoint
CREATE INDEX "idx_prediction_steps_timestamp" ON "prediction_steps" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_prediction_steps_unique" ON "prediction_steps" USING btree ("prediction_id","step_number");--> statement-breakpoint
CREATE INDEX "idx_predictions_symbol_id" ON "predictions" USING btree ("symbol_id");--> statement-breakpoint
CREATE INDEX "idx_predictions_user_id" ON "predictions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_predictions_timeframe" ON "predictions" USING btree ("timeframe");--> statement-breakpoint
CREATE INDEX "idx_predictions_model_id" ON "predictions" USING btree ("model_id");--> statement-breakpoint
CREATE INDEX "idx_predictions_created_at" ON "predictions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_symbols_ticker" ON "symbols" USING btree ("ticker");--> statement-breakpoint
CREATE INDEX "idx_symbols_volume_rank" ON "symbols" USING btree ("volume_rank");--> statement-breakpoint
CREATE INDEX "idx_symbols_active" ON "symbols" USING btree ("is_active");