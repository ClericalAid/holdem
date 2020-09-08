#!/bin/bash

# Distribute some chips around
sleep 5 > myPipe &
sleep 1
echo "call" > myPipe; sleep 0.1
echo "call" > myPipe; sleep 0.1
echo "call" > myPipe; sleep 0.1
echo "call" > myPipe; sleep 0.1

echo "call" > myPipe; sleep 0.1
echo "call" > myPipe; sleep 0.1
echo "call" > myPipe; sleep 0.1
echo "call" > myPipe; sleep 0.1

echo "call" > myPipe; sleep 0.1
echo "call" > myPipe; sleep 0.1
echo "call" > myPipe; sleep 0.1
echo "call" > myPipe; sleep 0.1

echo "call" > myPipe; sleep 0.1
echo "call" > myPipe; sleep 0.1
echo "call" > myPipe; sleep 0.1
echo "call" > myPipe; sleep 0.1

echo "board" > myPipe; sleep 0.1
# Somebody will bet above a side pot amount, then fold.

echo "new" > myPipe; sleep 0.1
echo "board" > myPipe; sleep 0.1
