IMAGE_NAME = caf-integration-test
DOCKERFILE = Dockerfile
CONTEXT = ..

.PHONY: build test test-verbose clean

build:
	docker build -t $(IMAGE_NAME) -f $(DOCKERFILE) $(CONTEXT)

test: build
	docker run --rm $(IMAGE_NAME)

test-verbose: build
	docker run --rm $(IMAGE_NAME) --verbose

clean:
	docker rmi $(IMAGE_NAME) || true
