package com.familylibrary.dto;

import com.familylibrary.model.LendingStatus;
import lombok.Data;
import java.time.LocalDateTime; 
// No specific fields needed for just marking as returned, 
// but can add notes or other fields if required.
// Alternatively, can be an empty request body if the action is implicit in the endpoint.
// For now, let's assume we might want to pass a specific return date or new status if not just "RETURNED"

@Data
public class RecordBookReturnRequest {
    // Optional: if the return date is different from now()
    private LocalDateTime returnDate; 

    // Optional: If the status needs to be explicitly set (e.g., to something other than a simple RETURNED)
    // private LendingStatus status; 
} 