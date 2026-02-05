IMAGE_NAME = caf-integration-test
DOCKERFILE = Dockerfile
CONTEXT = ..

ifeq ($(VERBOSE),true)
  VERBOSE_FLAG = --verbose
else
  VERBOSE_FLAG =
endif

.PHONY: build test test-verbose test-all clean \
	test-claude-project test-claude-global \
	test-cursor-project test-cursor-global

build:
	docker build -t $(IMAGE_NAME) -f $(DOCKERFILE) $(CONTEXT)

test: test-claude-project

test-verbose: build
	docker run --rm $(IMAGE_NAME) --verbose

# Claude Code
test-claude-project: build
	docker run --rm $(IMAGE_NAME) --agent claude-code --scope project $(VERBOSE_FLAG)

test-claude-global: build
	docker run --rm $(IMAGE_NAME) --agent claude-code --scope global $(VERBOSE_FLAG)

# Cursor
test-cursor-project: build
	docker run --rm $(IMAGE_NAME) --agent cursor --scope project $(VERBOSE_FLAG)

test-cursor-global: build
	docker run --rm $(IMAGE_NAME) --agent cursor --scope global $(VERBOSE_FLAG)

test-all: build
	@echo "Running all integration tests..."
	docker run --rm $(IMAGE_NAME) --agent claude-code --scope project $(VERBOSE_FLAG)
	docker run --rm $(IMAGE_NAME) --agent claude-code --scope global $(VERBOSE_FLAG)
	docker run --rm $(IMAGE_NAME) --agent cursor --scope project $(VERBOSE_FLAG)
	docker run --rm $(IMAGE_NAME) --agent cursor --scope global $(VERBOSE_FLAG)

clean:
	docker rmi $(IMAGE_NAME) || true
