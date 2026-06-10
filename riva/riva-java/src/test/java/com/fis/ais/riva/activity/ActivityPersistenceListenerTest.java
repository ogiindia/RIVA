package com.fis.ais.riva.activity;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ActivityPersistenceListenerTest {

    @Mock ActivityLogRepository repository;
    @InjectMocks ActivityPersistenceListener listener;

    @Test
    void persistsActivityEvent() {
        var event = new ActivityEvent("user1", ActivityAction.SESSION_CREATED, null, null);

        listener.onActivity(event);

        ArgumentCaptor<ActivityLog> captor = ArgumentCaptor.forClass(ActivityLog.class);
        verify(repository).save(captor.capture());

        ActivityLog saved = captor.getValue();
        assertThat(saved.getUserId()).isEqualTo("user1");
        assertThat(saved.getAction()).isEqualTo(ActivityAction.SESSION_CREATED);
        assertThat(saved.getCaseId()).isNull();
        assertThat(saved.getAttributesJson()).isNull();
    }

    @Test
    void persistsEventWithAttributes() {
        var event = new ActivityEvent("user1", ActivityAction.CHAT_MESSAGE_SENT, "case-123",
                Map.of("messageLength", 42));

        listener.onActivity(event);

        ArgumentCaptor<ActivityLog> captor = ArgumentCaptor.forClass(ActivityLog.class);
        verify(repository).save(captor.capture());

        ActivityLog saved = captor.getValue();
        assertThat(saved.getCaseId()).isEqualTo("case-123");
        assertThat(saved.getAttributesJson()).contains("messageLength");
        assertThat(saved.getAttributesJson()).contains("42");
    }

    @Test
    void swallowsExceptionOnPersistFailure() {
        when(repository.save(any())).thenThrow(new RuntimeException("DB down"));

        var event = new ActivityEvent("user1", ActivityAction.SESSION_CREATED, null, null);

        // Should not throw
        listener.onActivity(event);

        verify(repository).save(any());
    }
}
