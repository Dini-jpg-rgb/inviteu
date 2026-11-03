package handlers

import (
	"context"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
)

// DBQuerier captures the subset of database query methods needed for readiness validation,
// satisfied by both *pgxpool.Pool and pgx.Tx.
type DBQuerier interface {
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
}

// ValidateInvitationReadiness checks whether an invitation is complete and ready to be published or previewed.
// It verifies:
//  1. Template status is 'publish'
//  2. Event completeness: name, date, start_time, and location are all required.
//     Alasan: tanggal, waktu, dan lokasi terkunci setelah publish.
//  3. Section and field requirements:
//     Section wajib hanya ditegakkan lewat field wajib di dalamnya; section tanpa field dilewati (media menyusul).
//     Effective value is calculated as: COALESCE(NULLIF(TRIM(ic.value),”), NULLIF(TRIM(tf.default_value),”))
//
// Returns a flat map of errors {"fields.<field_id>": "message", "event.<column>": "message"} or nil if valid.
func ValidateInvitationReadiness(
	ctx context.Context,
	db DBQuerier,
	invitationID int64,
	templateID int64,
	versionID int64,
) (map[string]string, error) {
	errs := make(map[string]string)

	// 1. Template status check: template induk harus berstatus 'publish'
	var templateStatus string
	err := db.QueryRow(ctx, `SELECT status FROM templates WHERE id = $1`, templateID).Scan(&templateStatus)
	if err != nil {
		return nil, fmt.Errorf("verify template status: %w", err)
	}
	if templateStatus != "publish" {
		errs["template"] = "Template is not published"
	}

	// 2. Event completeness check
	// Kelengkapan event sebelum publish: name, date, start_time, dan location wajib terisi.
	// Alasan: tanggal, waktu, dan lokasi terkunci setelah publish.
	var (
		eventName     *string
		eventDate     *string
		eventStart    *string
		eventLocation *string
	)
	eventErr := db.QueryRow(ctx, `
		SELECT e.name, e.date::text, e.start_time::text, e.location
		FROM invitation_events ie
		INNER JOIN events e ON e.id = ie.event_id
		WHERE ie.invitation_id = $1
		ORDER BY ie.sort_order ASC, ie.id ASC
		LIMIT 1
	`, invitationID).Scan(&eventName, &eventDate, &eventStart, &eventLocation)

	if eventErr != nil {
		if eventErr == pgx.ErrNoRows {
			errs["event.name"] = "Event name is required"
			errs["event.date"] = "Event date is required"
			errs["event.start_time"] = "Event start time is required"
			errs["event.location"] = "Event location is required"
		} else {
			return nil, fmt.Errorf("verify event data: %w", eventErr)
		}
	} else {
		if eventName == nil || strings.TrimSpace(*eventName) == "" {
			errs["event.name"] = "Event name is required"
		}
		if eventDate == nil || strings.TrimSpace(*eventDate) == "" {
			errs["event.date"] = "Event date is required"
		}
		if eventStart == nil || strings.TrimSpace(*eventStart) == "" {
			errs["event.start_time"] = "Event start time is required"
		}
		if eventLocation == nil || strings.TrimSpace(*eventLocation) == "" {
			errs["event.location"] = "Event location is required"
		}
	}

	// 3. Section and Field requirements
	// Section wajib hanya ditegakkan lewat field wajib di dalamnya; section tanpa field dilewati (media menyusul).
	// Nilai efektif: COALESCE(NULLIF(TRIM(ic.value),''), NULLIF(TRIM(tf.default_value),''))
	rows, err := db.Query(ctx, `
		SELECT tf.id, tf.label,
		       COALESCE(NULLIF(TRIM(ic.value), ''), NULLIF(TRIM(tf.default_value), '')) AS effective_val
		FROM template_fields tf
		INNER JOIN template_sections ts ON ts.id = tf.template_section_id
		LEFT JOIN invitation_contents ic ON ic.template_field_id = tf.id AND ic.invitation_version_id = $2
		WHERE ts.template_id = $1
		  AND tf.is_required = true
		ORDER BY tf.sort_order ASC, tf.id ASC
	`, templateID, versionID)
	if err != nil {
		return nil, fmt.Errorf("verify required template fields: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var (
			fieldID      int64
			fieldLabel   string
			effectiveVal *string
		)
		if err := rows.Scan(&fieldID, &fieldLabel, &effectiveVal); err != nil {
			return nil, fmt.Errorf("scan required field: %w", err)
		}

		if effectiveVal == nil {
			key := fmt.Sprintf("fields.%d", fieldID)
			msg := "Field is required"
			if trimmed := strings.TrimSpace(fieldLabel); trimmed != "" {
				msg = fmt.Sprintf("%s is required", trimmed)
			}
			errs[key] = msg
		}
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate required template fields: %w", err)
	}

	if len(errs) > 0 {
		return errs, nil
	}
	return nil, nil
}
