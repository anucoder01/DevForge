package com.devforge.backend.payload.request;

import jakarta.validation.constraints.NotBlank;

public class GitWebhookPayload {
    @NotBlank
    private String type; // COMMIT, PR_OPEN, PR_MERGE

    @NotBlank
    private String refName;

    @NotBlank
    private String author;

    @NotBlank
    private String message;

    private String url;

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getRefName() {
        return refName;
    }

    public void setRefName(String refName) {
        this.refName = refName;
    }

    public String getAuthor() {
        return author;
    }

    public void setAuthor(String author) {
        this.author = author;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }
}
