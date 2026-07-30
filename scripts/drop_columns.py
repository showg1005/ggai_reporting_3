#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""AWS インスタンス上の .csv.gz データから指定カラムを削除するスクリプト.

元データのカラム::

    d_city, d_pref_name, d_city_name, d_spot_id, d_spot_name, d_arrive_date,
    lodging_city, lodging_pref_name, lodging_city_name, lodging_mesh, gender,
    age_group, home_city, home_pref_name, home_city_name, mode, stay_flag,
    countw, d_stay_time, lodging_expenditure

このうち次の 5 カラムを削除して、新しい .csv.gz を出力する::

    d_city, d_spot_id, lodging_city, lodging_mesh, home_city

特徴:
  * 単一ファイル・ディレクトリ（配下の *.csv.gz を一括処理）の両方に対応
  * pandas の chunksize による分割読み込みで、数 GB 級でもメモリ安全
  * gzip 圧縮したまま入出力（一時的な解凍ファイルを作らない）
  * 削除対象カラムが存在しなくても警告のみで処理継続

使用例:
    # 単一ファイル -> data_trimmed.csv.gz を同じディレクトリに出力
    python drop_columns.py /path/to/data.csv.gz

    # ディレクトリ内の *.csv.gz をまとめて別ディレクトリへ出力
    python drop_columns.py /path/to/input_dir -o /path/to/output_dir

    # チャンクサイズや接尾辞を変更
    python drop_columns.py data.csv.gz --chunksize 500000 --suffix _dropped
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import pandas as pd

# 削除するカラム
COLUMNS_TO_DROP = ["d_city", "d_spot_id", "lodging_city", "lodging_mesh", "home_city"]

# 入力ファイルの拡張子
INPUT_SUFFIX = ".csv.gz"


def process_file(
    src: Path,
    dst: Path,
    chunksize: int = 1_000_000,
    encoding: str = "utf-8",
) -> None:
    """1 つの .csv.gz を読み込み、指定カラムを削除して .csv.gz へ書き出す.

    Args:
        src: 入力 .csv.gz ファイル.
        dst: 出力 .csv.gz ファイル.
        chunksize: 一度に読み込む行数（分割読み込み）.
        encoding: 文字コード.
    """
    dst.parent.mkdir(parents=True, exist_ok=True)

    first_chunk = True
    total_rows = 0

    # compression="gzip" で gz のまま読み書き。dtype=str は使わず元の型推定に任せるが、
    # 数値カラム（countw など）の欠損混在で型がぶれないよう low_memory=False 相当の
    # 分割読み込みを採用する。
    reader = pd.read_csv(
        src,
        compression="gzip",
        chunksize=chunksize,
        encoding=encoding,
    )

    for chunk in reader:
        # 存在するカラムだけを削除対象にする（無ければ無視）
        drop_cols = [c for c in COLUMNS_TO_DROP if c in chunk.columns]

        if first_chunk:
            missing = [c for c in COLUMNS_TO_DROP if c not in chunk.columns]
            if missing:
                print(
                    f"  [警告] 次のカラムは入力に存在しません（スキップ）: {missing}",
                    file=sys.stderr,
                )

        trimmed = chunk.drop(columns=drop_cols)

        # 最初のチャンクだけヘッダ付きで新規書き込み、以降は追記
        trimmed.to_csv(
            dst,
            index=False,
            compression="gzip",
            encoding=encoding,
            mode="w" if first_chunk else "a",
            header=first_chunk,
        )

        total_rows += len(trimmed)
        first_chunk = False

    if first_chunk:
        # 1 行も読めなかった（空ファイル等）
        print(f"  [警告] データ行がありませんでした: {src}", file=sys.stderr)
    else:
        print(f"  -> {dst}  ({total_rows:,} 行)")


def build_output_path(src: Path, input_root: Path, output_root: Path, suffix: str) -> Path:
    """入力パスから出力パスを組み立てる.

    ``foo.csv.gz`` -> ``foo{suffix}.csv.gz`` としてファイル名を変換する。
    ディレクトリ処理時は入力側の相対構造を出力側にも維持する。
    """
    # ".csv.gz" を取り除いてベース名を得る
    base = src.name[: -len(INPUT_SUFFIX)] if src.name.endswith(INPUT_SUFFIX) else src.stem
    out_name = f"{base}{suffix}{INPUT_SUFFIX}"

    rel_parent = src.parent.relative_to(input_root) if src != input_root else Path(".")
    return output_root / rel_parent / out_name


def collect_inputs(input_path: Path) -> list[Path]:
    """入力パスから処理対象の .csv.gz 一覧を得る."""
    if input_path.is_file():
        return [input_path]
    if input_path.is_dir():
        return sorted(input_path.rglob(f"*{INPUT_SUFFIX}"))
    raise FileNotFoundError(f"入力パスが存在しません: {input_path}")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description=".csv.gz から指定カラムを削除して別の .csv.gz を出力する",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "input",
        type=Path,
        help="入力 .csv.gz ファイル、またはそれらを含むディレクトリ",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=None,
        help="出力先。省略時は入力と同じ場所に接尾辞付きで出力する",
    )
    parser.add_argument(
        "--suffix",
        default="_trimmed",
        help="出力ファイル名に付ける接尾辞",
    )
    parser.add_argument(
        "--chunksize",
        type=int,
        default=1_000_000,
        help="分割読み込みの行数（メモリに応じて調整）",
    )
    parser.add_argument(
        "--encoding",
        default="utf-8",
        help="CSV の文字コード",
    )
    args = parser.parse_args(argv)

    input_path: Path = args.input

    try:
        inputs = collect_inputs(input_path)
    except FileNotFoundError as exc:
        print(f"[エラー] {exc}", file=sys.stderr)
        return 1

    if not inputs:
        print(f"[エラー] 処理対象の {INPUT_SUFFIX} が見つかりません: {input_path}", file=sys.stderr)
        return 1

    # 出力ルートと入力ルートを決める
    if input_path.is_dir():
        input_root = input_path
        output_root = args.output if args.output is not None else input_path
    else:
        input_root = input_path.parent
        output_root = args.output if args.output is not None else input_path.parent
        # 出力にファイルパスを直接指定された場合はそれを尊重
        if args.output is not None and args.output.suffix == ".gz":
            print(f"[1/1] {input_path.name}")
            process_file(input_path, args.output, args.chunksize, args.encoding)
            print("完了しました。")
            return 0

    print(f"{len(inputs)} 件の {INPUT_SUFFIX} を処理します。")
    print(f"削除カラム: {COLUMNS_TO_DROP}\n")

    for i, src in enumerate(inputs, 1):
        dst = build_output_path(src, input_root, output_root, args.suffix)
        print(f"[{i}/{len(inputs)}] {src}")
        if dst.resolve() == src.resolve():
            print("  [スキップ] 出力パスが入力と同一です。--suffix か -o を指定してください。", file=sys.stderr)
            continue
        try:
            process_file(src, dst, args.chunksize, args.encoding)
        except Exception as exc:  # noqa: BLE001 - 1 ファイルの失敗で全体を止めない
            print(f"  [エラー] 処理に失敗しました: {exc}", file=sys.stderr)

    print("\n完了しました。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
